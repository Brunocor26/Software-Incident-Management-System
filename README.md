# Software Incident Management System

A comprehensive web-based incident management system designed to help organizations track, manage, and resolve software, network, and hardware incidents efficiently.

## 📋 Features

- **User Authentication**: Secure login system with JWT-based authentication
- **Incident Tracking**: Create, update, and manage incidents with detailed information
- **Categorization**: Organize incidents by category (software, network, hardware)
- **Priority Management**: Assign priority levels (low, medium, high) to incidents
- **Status Tracking**: Monitor incident lifecycle (open, in-progress, closed)
- **Assignment System**: Assign incidents to specific team members
- **Timeline History**: Track all changes and actions on each incident
- **SLA Management**: Monitor Service Level Agreement compliance
- **Attachment Support**: Upload and manage files related to incidents
- **Tagging System**: Organize incidents with custom tags
- **Dashboard**: Visual overview of incidents and system status

## 🚀 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **dotenv** - Environment configuration
- **CORS** - Cross-origin resource sharing

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling
- **JavaScript** - Client-side logic
- **Vanilla JS** - No framework dependencies

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/Brunocor26/Software-Incident-Management-System.git
   cd Software-Incident-Management-System
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `backend` directory with the following variables:
   ```env
   MONGO_URI=mongodb://localhost:27017/incident-management
   PORT=3000
   JWT_SECRET=your_jwt_secret_key_here
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   ```bash
   # For local MongoDB
   mongod
   ```

5. **Start the backend server**
   ```bash
   cd backend
   node server.js
   ```

   The server will start on `http://localhost:3000` (or the port specified in your `.env` file)

6. **Access the application**
   
   Open the frontend in your browser:
   ```bash
   # Navigate to frontend directory and open the HTML files
   # For example, open frontend/public/login/login.html
   ```

## 🔧 Project Structure

```
Software-Incident-Management-System/
├── backend/
│   ├── login/              # Login route handlers
│   │   └── login.js
│   ├── models/             # Database models
│   │   ├── incidentModel.js
│   │   └── userModel.js
│   ├── routes/             # API routes
│   │   └── incidents.js
│   ├── scripts/            # Utility scripts
│   ├── server.js           # Main server file
│   ├── userRoutes.js       # User-related routes
│   └── package.json
├── frontend/
│   ├── public/
│   │   ├── Dashboard/      # Dashboard interface
│   │   ├── incidents/      # Incident management UI
│   │   └── login/          # Login interface
│   └── src/
│       └── index.js
├── .gitignore
├── package.json
└── README.md
```

## 📚 API Endpoints

### Authentication
- `POST /login` - User authentication

### Incidents
- `GET /incidents` - List all incidents
- `POST /incidents` - Create a new incident
- `GET /incidents/:id` - Get incident details
- `PUT /incidents/:id` - Update an incident
- `DELETE /incidents/:id` - Delete an incident

## 🗄️ Database Schema

### User Model
- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (required)
- `papel`: String (role)
- Timestamps: createdAt, updatedAt

### Incident Model
- `title`: String (required)
- `description`: String
- `category`: Enum (software, network, hardware)
- `status`: Enum (open, in-progress, closed)
- `priority`: Enum (low, medium, high)
- `assignedTo`: Reference to User
- `createdBy`: Reference to User (required)
- `tags`: Array of Strings
- `attachments`: Array of Attachment objects
- `timeline`: Array of timeline events
- `sla`: SLA configuration object
- Timestamps: createdAt, updatedAt

## 🛠️ Development

### Running in Development Mode

For development with auto-reload:
```bash
# Install nodemon globally if not already installed
npm install -g nodemon

# Run backend with nodemon
cd backend
nodemon server.js
```

### Database Scripts

Check the `backend/scripts/` directory for database utilities and seed scripts.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/improvement`)
3. Make your changes
4. Commit your changes (`git commit -am 'Add new feature'`)
5. Push to the branch (`git push origin feature/improvement`)
6. Create a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Bruno Correia**
- GitHub: [@Brunocor26](https://github.com/Brunocor26)

## 🐛 Known Issues

- Password storage currently uses plain text comparison (should be updated to use bcrypt hashing)
- Frontend needs to be served through a web server for proper functionality

## 🔮 Future Enhancements

- [ ] Implement proper password hashing for all authentication
- [ ] Add email notifications for incident updates
- [ ] Implement real-time updates using WebSockets
- [ ] Add reporting and analytics dashboard
- [ ] Implement search and filtering capabilities
- [ ] Add multi-language support
- [ ] Create mobile-responsive design
- [ ] Add user role-based permissions
- [ ] Implement incident templates
- [ ] Add export functionality (PDF, CSV)

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainer.

---

**Note**: This is a development version. For production use, ensure proper security measures including HTTPS, secure password storage, input validation, and environment-specific configurations.
