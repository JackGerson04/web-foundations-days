const USERS_URL = "https://jsonplaceholder.typicode.com/users";

const loadUsersButton = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const statusMessage = document.getElementById("status");
const usersList = document.getElementById("users-list");

// Keep the fetched records in memory so filtering does not send another request.
let users = [];

async function loadUsers() {
  loadUsersButton.disabled = true;
  users = [];
  statusMessage.textContent = "Loading users...";
  usersList.replaceChildren();

  try {
    const response = await fetch(USERS_URL);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("The server returned an unexpected response.");
    }

    users = data;
    renderUsers(users);

    if (users.length === 0) {
      statusMessage.textContent = "The server returned no users.";
    } else {
      statusMessage.textContent = `Successfully loaded ${users.length} users.`;
    }
  } catch (error) {
    console.error("Unable to load users:", error);
    statusMessage.textContent = "Error loading users. Please check your connection and try again.";
    usersList.replaceChildren();
  } finally {
    loadUsersButton.disabled = false;
  }
}

function renderUsers(list) {
  usersList.replaceChildren();

  if (list.length === 0) {
    // Do not overwrite an existing loading or network-error message.
    if (users.length > 0) {
      statusMessage.textContent = "No users match your filter.";
    }
    return;
  }

  for (const user of list) {
    const item = document.createElement("li");
    const nameHeading = document.createElement("h2");
    const emailParagraph = document.createElement("p");
    const cityParagraph = document.createElement("p");
    const companyParagraph = document.createElement("p");

    nameHeading.textContent = user.name ?? "Name unavailable";
    emailParagraph.textContent = `Email: ${user.email ?? "Not available"}`;
    cityParagraph.textContent = `City: ${user.address?.city ?? "Not available"}`;
    companyParagraph.textContent = `Company: ${user.company?.name ?? "Not available"}`;

    item.append(nameHeading, emailParagraph, cityParagraph, companyParagraph);
    usersList.appendChild(item);
  }
}

loadUsersButton.addEventListener("click", loadUsers);

filterInput.addEventListener("input", () => {
  const query = filterInput.value.trim().toLowerCase();

  // Filter the existing array; this event does not call fetch().
  const matchingUsers = users.filter((user) =>
    (user.name ?? "").toLowerCase().includes(query)
  );

  renderUsers(matchingUsers);

  if (matchingUsers.length > 0 && users.length > 0) {
    statusMessage.textContent = query === ""
      ? `Successfully loaded ${users.length} users.`
      : `Showing ${matchingUsers.length} of ${users.length} users.`;
  }
});
