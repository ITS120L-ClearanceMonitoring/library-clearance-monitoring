import { useState } from 'react';
import '../faq.css';

const faqs = [
  {
    category: 'General',
    items: [
      {
        question: 'What is the Library Clearance Monitoring System?',
        answer:
          'The Library Clearance Monitoring System is a web-based platform used to manage and track student library clearance requests. It allows librarians and administrators to review, approve, or reject clearance submissions, manage student records, and maintain an audit history of all actions taken within the system.',
      },
      {
        question: 'What roles are available in the system?',
        answer:
          'There are two staff roles: Librarian and Library Admin. Librarians can view and manage clearance requests and student records. Library Admins have full access, including History logs, User Management, and System Configuration settings.',
      },
      {
        question: 'How do I log in to the system?',
        answer:
          'Navigate to the login page and enter your registered email address and password. If this is your first time logging in, use the temporary credentials provided by your system administrator and change your password immediately after logging in.',
      },
      {
        question: 'What should I do if I forget my password?',
        answer:
          'Click the "Forgot Password" link on the login page. Enter your registered email address and a password reset link will be sent to you. Follow the link in the email to set a new password. If you do not receive the email, check your spam folder or contact your system administrator.',
      },
    ],
  },
  {
    category: 'Managing Clearances',
    items: [
      {
        question: 'How do I view pending clearance requests?',
        answer:
          'Navigate to the Clearances page from the sidebar. The list displays all submitted clearance requests. You can filter by status (Pending, Approved, Rejected) and search by student name or ID number to quickly locate a specific request.',
      },
      {
        question: 'How do I approve or reject a clearance request?',
        answer:
          'Open a clearance request by clicking on it from the Clearances list. Review the student details and any associated documents. Use the "Approve" or "Reject" button at the bottom of the detail page. You may be required to provide a reason when rejecting a request.',
      },
      {
        question: 'Can I undo an approval or rejection?',
        answer:
          'Once a clearance is approved or rejected, it cannot be automatically reversed. If a correction is needed, please contact your Library Admin, who may have the ability to reset a clearance status depending on system configuration.',
      },
      {
        question: 'What does the clearance status "Pending" mean?',
        answer:
          '"Pending" means the student has submitted a clearance request that has not yet been reviewed by a librarian or administrator. These requests require action and should be processed in a timely manner.',
      },
    ],
  },
  {
    category: 'User Management (Admin Only)',
    items: [
      {
        question: 'How do I add a new librarian account?',
        answer:
          'Go to the Users page from the sidebar (visible to Admins only). Click the "+ Add User" button, fill in the required details such as name, email, and role, then submit the form. The new librarian will receive an email with instructions to set up their password.',
      },
      {
        question: 'How do I deactivate or remove a user?',
        answer:
          'On the Users page, locate the user you wish to manage. Use the available action buttons to deactivate or delete the account. Deactivating a user prevents them from logging in without permanently removing their records from the system.',
      },
      {
        question: "Can I edit an existing user's details?",
        answer:
          "Yes. From the Users page, click the Edit button next to the user's name. You can update their first name, last name, email address, and role. Save the changes when done.",
      },
    ],
  },
  {
    category: 'System Configuration (Admin Only)',
    items: [
      {
        question: 'What can I configure under System Settings?',
        answer:
          'The Configuration page allows admins to manage Programs and Clearance Purposes. Programs define the academic courses associated with student clearances, while Purposes describe the reasons a student may request a clearance (e.g., graduation, enrollment).',
      },
      {
        question: 'How do I add a new academic program?',
        answer:
          'Go to Settings → Configuration and select the Programs tab. Click "+ Add Program", enter the program name and code, then save. The new program will immediately be available when processing clearance requests.',
      },
      {
        question: 'Can I delete a program or purpose that is already in use?',
        answer:
          'Deleting a program or purpose that is already linked to existing clearance records may cause data inconsistencies. It is recommended to check for active records before deleting. Some system-default entries (such as "Others") are protected and cannot be deleted.',
      },
    ],
  },
  {
    category: 'History & Audit Logs (Admin Only)',
    items: [
      {
        question: 'Where can I view the history of actions taken in the system?',
        answer:
          'Navigate to the History page from the sidebar. This page displays an audit log of all significant actions, including clearance approvals, rejections, user changes, and configuration updates. Each log entry shows the action, the user who performed it, and a timestamp.',
      },
      {
        question: 'Can history logs be deleted or edited?',
        answer:
          'No. History logs are read-only and cannot be modified or deleted. This ensures a reliable and tamper-proof audit trail of all activities within the system.',
      },
    ],
  },
  {
    category: 'Session & Security',
    items: [
      {
        question: 'Why was I automatically logged out?',
        answer:
          'The system has an inactivity timeout feature. If your session is idle for 30 minutes, you will receive a warning. If no action is taken within 5 minutes of that warning, you will be automatically logged out to protect the security of the system.',
      },
      {
        question: 'How do I change my password?',
        answer:
          'To change your password while logged in, use the "Forgot Password" feature. Click the logout button and then navigate to the login page. Click "Forgot Password," enter your email address, and follow the reset link sent to your email. You will be able to set a new password. Passwords should be at least 8 characters and include a mix of letters, numbers, and symbols for security.',
      },
    ],
  },
];

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}>
      <button
        type="button"
        className="faq-question"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <span className="faq-chevron">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="faq-answer">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

const FAQPage = () => {
  const [search, setSearch] = useState('');

  const filteredFaqs = faqs
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.question.toLowerCase().includes(search.toLowerCase()) ||
          item.answer.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h2>Frequently Asked Questions</h2>
        <p>Find answers to common questions about using the Library Clearance Monitoring System as an administrator or librarian.</p>
      </div>

      <div className="faq-search-wrapper">
        <input
          type="text"
          className="faq-search"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredFaqs.length === 0 ? (
        <div className="faq-empty">
          <p>No results found for "<strong>{search}</strong>". Try a different keyword.</p>
        </div>
      ) : (
        filteredFaqs.map((category) => (
          <div key={category.category} className="faq-category">
            <h3 className="faq-category-title">{category.category}</h3>
            <div className="faq-list">
              {category.items.map((item) => (
                <FAQItem key={item.question} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default FAQPage;