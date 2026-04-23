// Initialize Lucide Icons
lucide.createIcons();

// --- Landing Page Transition ---
const landingPage = document.getElementById('landingPage');
const appContainer = document.getElementById('appContainer');
const enterBtn = document.getElementById('enterBtn');

enterBtn.addEventListener('click', () => {
  landingPage.classList.add('hidden');
  setTimeout(() => {
    appContainer.classList.remove('hidden');
  }, 500); // Wait for landing page to fade out
});
// -------------------------------


const API_URL = '/api/contacts';

// DOM Elements
const contactForm = document.getElementById('contactForm');
const formTitle = document.getElementById('formTitle');
const contactIdInput = document.getElementById('contactId');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const contactList = document.getElementById('contactList');
const contactCount = document.getElementById('contactCount');
const searchInput = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');
const toastContainer = document.getElementById('toastContainer');

// State
let contacts = [];
let dragStartIndex = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  fetchContacts();
});

// Toast Notification System
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let iconName = 'info';
  if(type === 'success') iconName = 'check-circle';
  if(type === 'error') iconName = 'alert-circle';

  toast.innerHTML = `
    <i data-lucide="${iconName}"></i>
    <span>${message}</span>
  `;
  
  toastContainer.appendChild(toast);
  lucide.createIcons();

  // Remove toast after animation ends
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Fetch contacts from backend
async function fetchContacts() {
  try {
    const response = await fetch(API_URL);
    contacts = await response.json();
    renderContacts();
  } catch (error) {
    console.error('Error fetching contacts:', error);
    showToast('Failed to load contacts. Ensure server is running.', 'error');
  }
}

// Render contacts list
function renderContacts(filterText = '') {
  contactList.innerHTML = '';
  
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(filterText.toLowerCase()) || 
    contact.email.toLowerCase().includes(filterText.toLowerCase())
  );

  contactCount.textContent = `${filteredContacts.length} Total`;

  if (filteredContacts.length === 0) {
    emptyState.classList.add('visible');
  } else {
    emptyState.classList.remove('visible');
    
    filteredContacts.forEach((contact, index) => {
      const li = document.createElement('li');
      li.className = 'contact-item';
      li.draggable = true;
      li.dataset.id = contact._id;
      li.dataset.index = index;

      li.innerHTML = `
        <div class="contact-info">
          <span class="contact-name">${contact.name}</span>
          <span class="contact-detail">
            <i data-lucide="mail"></i> ${contact.email}
          </span>
          <span class="contact-detail">
            <i data-lucide="phone"></i> ${contact.phone}
          </span>
        </div>
        <div class="item-actions">
          <button class="icon-btn edit-btn" onclick="editContact('${contact._id}')" title="Edit">
            <i data-lucide="edit-2"></i>
          </button>
          <button class="icon-btn delete-btn" onclick="deleteContact('${contact._id}')" title="Delete">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;
      contactList.appendChild(li);

      // Drag and Drop Event Listeners
      li.addEventListener('dragstart', dragStart);
      li.addEventListener('dragover', dragOver);
      li.addEventListener('drop', dragDrop);
      li.addEventListener('dragenter', dragEnter);
      li.addEventListener('dragleave', dragLeave);
    });
    
    // Re-initialize icons for newly added elements
    lucide.createIcons();
  }
}

// Add or Update Contact
contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = contactIdInput.value;
  const newContact = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim()
  };

  if (!newContact.name || !newContact.email || !newContact.phone) {
    showToast("Please fill out all fields", "error");
    return;
  }

  // Change button state to loading
  const originalBtnContent = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i data-lucide="loader" class="spin"></i> Processing...';
  lucide.createIcons();
  submitBtn.disabled = true;

  try {
    if (id) {
      // Update
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });
      const updatedContact = await response.json();
      contacts = contacts.map(c => c._id === id ? updatedContact : c);
      showToast("Contact updated successfully!", "success");
    } else {
      // Add
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact)
      });
      const createdContact = await response.json();
      contacts.push(createdContact);
      showToast("Contact added successfully!", "success");
    }

    resetForm();
    renderContacts(searchInput.value);
  } catch (error) {
    console.error('Error saving contact:', error);
    showToast("An error occurred while saving.", "error");
  } finally {
    submitBtn.innerHTML = originalBtnContent;
    submitBtn.disabled = false;
    lucide.createIcons();
  }
});

// Delete Contact
async function deleteContact(id) {
  // Use a custom confirm logic, but native confirm is fine for now
  if (confirm('Are you sure you want to delete this contact?')) {
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      contacts = contacts.filter(c => c._id !== id);
      renderContacts(searchInput.value);
      showToast("Contact deleted.", "info");
    } catch (error) {
      console.error('Error deleting contact:', error);
      showToast("Failed to delete contact.", "error");
    }
  }
}

// Edit Contact (Populate Form)
function editContact(id) {
  const contact = contacts.find(c => c._id === id);
  if (contact) {
    contactIdInput.value = contact._id;
    nameInput.value = contact.name;
    emailInput.value = contact.email;
    phoneInput.value = contact.phone;

    formTitle.innerHTML = '<i data-lucide="user-check" style="color: var(--success);"></i> Update Contact';
    submitBtn.innerHTML = '<i data-lucide="save" class="btn-icon"></i> Update';
    cancelEditBtn.classList.remove('hidden');
    lucide.createIcons();
    
    // Scroll to form
    contactForm.scrollIntoView({ behavior: 'smooth' });
  }
}

// Cancel Edit
cancelEditBtn.addEventListener('click', resetForm);

// Reset Form
function resetForm() {
  contactForm.reset();
  contactIdInput.value = '';
  formTitle.innerHTML = '<i data-lucide="user-plus" style="color: var(--accent-1);"></i> Add New Contact';
  submitBtn.innerHTML = '<i data-lucide="plus" class="btn-icon"></i> Add Contact';
  cancelEditBtn.classList.add('hidden');
  lucide.createIcons();
}

// Search / Filter
searchInput.addEventListener('input', (e) => {
  renderContacts(e.target.value);
});

// --- Drag and Drop functionality ---

function dragStart(e) {
  dragStartIndex = +e.target.closest('.contact-item').dataset.index;
  e.target.classList.add('dragging');
}

function dragEnter(e) {
  e.preventDefault();
  e.target.closest('.contact-item')?.classList.add('drag-over');
}

function dragLeave(e) {
  e.target.closest('.contact-item')?.classList.remove('drag-over');
}

function dragOver(e) {
  e.preventDefault();
}

function dragDrop(e) {
  const dragEndIndex = +e.target.closest('.contact-item').dataset.index;
  e.target.closest('.contact-item')?.classList.remove('drag-over');
  swapItems(dragStartIndex, dragEndIndex);
  e.target.closest('.contact-item')?.classList.remove('dragging');
}

function swapItems(fromIndex, toIndex) {
  if(fromIndex === toIndex || isNaN(fromIndex) || isNaN(toIndex)) return;
  
  const itemOne = contacts[fromIndex];
  const itemTwo = contacts[toIndex];
  
  // Swap in array
  contacts[fromIndex] = itemTwo;
  contacts[toIndex] = itemOne;
  
  renderContacts(searchInput.value);
  showToast("Order updated", "info");
}

// Spin animation for loader
const style = document.createElement('style');
style.innerHTML = `
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { 100% { transform: rotate(360deg); } }
`;
document.head.appendChild(style);
