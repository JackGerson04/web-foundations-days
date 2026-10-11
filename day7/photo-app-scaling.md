# SnapShare: Photo-App Scaling Plan

## 1. Assumptions

This plan uses the supplied figures and the following explicit assumptions:

- SnapShare has **10,000,000 registered users**.
- **10% of registered users are active daily**; therefore, daily active users (DAU) are calculated as 10,000,000 × 0.10.
- Each daily active user uploads **one original photo per day** and views **50 feed pages per day**.
- Each original photo averages **2 MB**, and each photo produces one **50 KB thumbnail**.
- A year has **365 days**. For straightforward capacity estimates, MB, GB and TB use decimal units: 1 MB = 1,000 KB, 1 GB = 1,000 MB and 1 TB = 1,000 GB.
- Daily activity and requests are averaged over 24 hours for average rates. Feed-view peak planning uses the required **5× average rate**. If the same 5× factor is used as a rough upload peak estimate, peak uploads are also shown below, but this is not a measured traffic pattern.
- Storage calculations cover one original and one thumbnail per photo only. They exclude database records, logs, replicas, backups, retries, temporary files, additional image sizes and storage overhead.

## 2. Traffic and storage calculations

### Daily active users

10,000,000 registered users × 10% active daily = **1,000,000 daily active users**.

### Photo uploads per second

Each daily active user uploads one photo per day:

- Uploads per day = 1,000,000 × 1 = **1,000,000 photos/day**.
- Average uploads per second = 1,000,000 ÷ 86,400 = **11.57 uploads/second**, or about **12 uploads/second**.
- Optional rough peak estimate if uploads also peak at 5× average = 11.57 × 5 = **57.87 uploads/second**, or about **58 uploads/second**. The assignment only specifies the 5× peak factor for feed views; this upload peak is a planning assumption, not a supplied fact.

### Feed views per second

Each daily active user views 50 feed pages per day:

- Feed views per day = 1,000,000 × 50 = **50,000,000 feed views/day**.
- Average feed views per second = 50,000,000 ÷ 86,400 = **578.70 feed views/second**, or about **579/second**.
- Peak feed views per second = 578.70 × 5 = **2,893.52 feed views/second**, or about **2,894/second**.

These are feed-page requests, not individual image downloads; a page may cause multiple image requests, some of which may be served by the CDN.

### Photo storage per year

Annual photo count:

1,000,000 uploads/day × 365 days = **365,000,000 photos/year**.

| Data stored | Calculation | Approximate annual storage |
|---|---:|---:|
| Original photos | 365,000,000 × 2 MB | **730,000 GB = 730 TB** |
| Thumbnails | 365,000,000 × 50 KB = 18,250,000,000 KB | **18,250 GB = 18.25 TB** |
| **Total original + thumbnail data** | 730 TB + 18.25 TB | **748.25 TB/year** |

The estimate is for one year of new uploads, before replication, backups, extra variants or other overhead. If SnapShare retains all photos, total stored data will grow each year; actual provisioned capacity must include redundancy, retention policy and operational headroom.

## 3. Is SnapShare read-heavy or write-heavy?

SnapShare is **read-heavy** by request count: the users generate 50 million feed views per day compared with 1 million uploads per day, which is **50 feed views for every upload**. Image delivery may generate even more reads because a feed page usually contains several photos.

The design should therefore scale feed reads efficiently. A CDN should serve frequently requested photo files and thumbnails close to users; a cache should hold hot feed data and metadata; app servers should be horizontally scalable behind a load balancer; and database reads can be distributed to a read replica where slightly stale data is acceptable. Uploads still need durable storage and reliable processing, but the read path is the main request-volume concern.

## 4. Why photo files should not live inside the database

Photo files are large binary objects, and storing them directly in the relational database would increase database size, backups, replication traffic and pressure on database storage and I/O. Store the original photos and generated thumbnails in **object storage** instead, and keep their object keys/URLs, owner, timestamps and other searchable metadata in the database. This separates large-file delivery from transactional metadata queries and allows the CDN to cache image content efficiently.

## 5. Text architecture diagram

```text
                            +----------------------+
                            |      Mobile/Web      |
                            |        clients       |
                            +----------+-----------+
                                       |
                        Feed/API calls |       Image requests
                                       |             |
                                       v             v
                            +----------------+   +----------------+
                            | Load balancer  |   |      CDN       |
                            +-------+--------+   +-------+--------+
                                    |                    |
                                    v                    v
                            +----------------+   +----------------+
                            |  App servers   |   | Object storage |
                            | (stateless,    |   | originals and  |
                            |  horizontally  |   | thumbnails     |
                            |  scalable)     |   +----------------+
                            +---+--------+---+           ^
                                |        |               |
                       hot data |        | metadata      | thumbnail write
                                v        v               |
                         +-----------+  +---------------------+
                         |   Cache   |  | Primary database    |
                         | feed/meta|  | (users, posts, keys)|
                         +-----------+  +----------+----------+
                                                   |
                                                   | replication
                                                   v
                                         +---------------------+
                                         | Database read       |
                                         | replica             |
                                         +---------------------+

  Upload processing path:
  App servers ---> Upload job/message queue ---> Thumbnail worker
                                               |        |
                                               | reads  | creates and stores
                                               v        v
                                         Object storage <---+
                                               |
                                               +--> App/worker updates metadata in DB
```

**Implementation note:** For larger uploads, the app server can authenticate the user and issue a short-lived signed upload URL so the client sends the file directly to object storage. The client then tells the app server the upload completed, or storage emits an event; the server/consumer validates the object and enqueues thumbnail work. The diagram shows the logical services, not every network connection or security control.

## 6. What each component solves

- **Mobile/web clients:** Let users upload photos and request the feed through the app's public interface.
- **CDN:** Serves cached originals and thumbnails from nearby edge locations, reducing image latency and origin traffic.
- **Load balancer:** Distributes API requests across healthy app-server instances and avoids sending all traffic to one server.
- **App servers:** Authenticate and validate requests, manage feed and upload metadata, and coordinate database, storage and queue operations.
- **Cache:** Keeps frequently requested feed data and metadata in fast memory to reduce repeated database reads.
- **Primary database:** Reliably stores structured records such as users, posts, photo object keys, follows and processing status.
- **Database read replica:** Handles eligible read queries separately from the primary database, reducing read pressure on the write leader.
- **Object storage:** Stores large original photo files and generated thumbnail files durably without making the database hold the binary content.
- **Message queue:** Buffers thumbnail jobs so upload requests do not have to wait for image processing and temporary worker slowdowns do not lose jobs.
- **Thumbnail worker:** Consumes queued jobs, reads original images, creates resized thumbnails, saves them to object storage and records completion or failure.

## 7. Photo upload flow

1. **Authenticate and validate:** The client sends an upload request; an app server checks the user's identity, permissions, file type and size limits.
2. **Prepare the upload:** The app server creates a photo record with a pending-processing status and returns a short-lived signed upload URL or equivalent upload instructions.
3. **Upload the original:** The client sends the image to object storage using the signed URL, avoiding the need to stream a large file through the app server.
4. **Confirm and enqueue:** After upload confirmation (or a storage event), the backend verifies that the object exists and publishes a thumbnail-generation job to the durable queue.
5. **Return promptly:** The API can tell the client that the upload was accepted and processing is pending; the user does not have to wait for thumbnail generation to finish.
6. **Generate thumbnail:** A worker receives the job, reads the original from object storage, creates the 50 KB target thumbnail (or an appropriately sized compressed derivative), and stores it as a separate object.
7. **Update metadata:** The worker marks the photo as processed and records the thumbnail key/status in the database; failures are retried and eventually sent to a dead-letter queue or surfaced for investigation.
8. **Serve the feed:** When followers request a feed, app servers use cached data or query the database/read replica for post metadata, then return image URLs; the CDN serves the stored photo and thumbnail files.

## 8. Trade-offs

### CDN and cache versus freshness and invalidation

**Benefit:** CDN and cache reduce latency, database load and repeated origin reads. **Cost:** cached feed entries or images may be briefly stale, and updating or invalidating cached content adds complexity; use appropriate cache keys, time-to-live values and invalidation rules.

### Asynchronous thumbnails versus immediate completeness

**Benefit:** A queue and workers let the upload API respond quickly and allow image-processing capacity to scale independently. **Cost:** a newly uploaded photo may appear before its thumbnail is ready, so the interface needs a pending state or original-image fallback; workers also need retries and idempotent processing.

### Read replica versus perfectly fresh reads

**Benefit:** A read replica can take much of the feed-query load away from the primary database. **Cost:** replication lag means a newly uploaded photo or changed profile may not appear immediately in all feed reads; route freshness-sensitive queries to the primary or design for eventual consistency.

### Direct-to-object-storage uploads versus simpler server-mediated uploads

**Benefit:** Signed direct uploads reduce app-server bandwidth and make large files easier to scale. **Cost:** signed URLs, expiration, object ownership checks, upload completion validation and abandoned-upload cleanup require additional implementation and security work.

## 9. Summary

With the supplied workload, SnapShare has **1 million daily active users**, averages **about 12 uploads/second** and **579 feed views/second**, with a planned peak of **about 2,894 feed views/second** using the required 5× factor. New original photos and thumbnails require approximately **748.25 TB of storage per year** using decimal units, before redundancy and overhead. Since feed reads greatly outnumber uploads, the core design uses CDN and caching for reads, scalable app servers behind a load balancer, a primary database with a read replica for metadata, object storage for images, and a queue plus workers for asynchronous thumbnail generation.
