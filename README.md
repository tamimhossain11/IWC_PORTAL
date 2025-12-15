# IWC Team-Based Document Submission Management System

A comprehensive full-stack application for managing team-based document submissions for Indonesian Visa Applications through the Embassy of the Republic of Indonesia in Dhaka.

## 🚀 Features

### Super Admin Panel
- Create and manage teams
- Add team members manually
- Assign registration IDs and payment IDs
- Manage admin accounts
- View all submissions and reports

### Document Admin Panel
- Review all document submissions
- Approve or reject documents with comments
- Email notifications to team members
- Export team data (ZIP/CSV)
- Filter and search functionality

### Team Member Portal
- Secure login (no self-registration)
- Upload Indonesian visa documents (PDF, JPG, PNG)
- View submission status and embassy admin comments
- Track team progress (status only, no file access)
- Receive email notifications for document approval/rejection

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **Prisma ORM** for database management
- **JWT** authentication
- **bcrypt** for password hashing
- **Cloudinary** for file storage
- **Nodemailer** for email notifications
- **Express Rate Limiting** for security

### Frontend
- **Next.js 14** with App Router
- **React Query (TanStack Query)** for state management
- **TailwindCSS** for styling
- **ShadCN UI** components
- **React Hook Form** with Zod validation
- **Axios** for API calls

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Cloudinary account (for file storage)
- Gmail account (for email notifications)

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd IWC
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/iwc_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Email (Gmail SMTP)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="IWC Team <your-email@gmail.com>"

# Server
PORT=5000
NODE_ENV="development"

# Frontend URL
FRONTEND_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with initial data
npm run prisma:seed
```

### 4. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🚀 Running the Application

### Start Backend Server
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5000`

### Start Frontend Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:3000`

## 👥 Default Login Credentials

After running the seed script, you can use these credentials:

### Super Admin
- **Email:** admin@iwc.com
- **Password:** admin123

### Document Admin
- **Email:** docadmin@iwc.com
- **Password:** docadmin123

### Team Member (Sample)
- **Email:** leader@team001.com
- **Password:** member123

## 📁 Project Structure

```
IWC/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── services/        # Business logic
│   │   ├── config/          # Configuration files
│   │   ├── prisma/          # Database schema & seed
│   │   └── server.js        # Main server file
│   └── package.json
├── frontend/
│   ├── app/                 # Next.js app directory
│   │   ├── admin/           # Admin panel pages
│   │   ├── dashboard/       # Team member dashboard
│   │   ├── upload/          # Document upload
│   │   └── team-progress/   # Team progress view
│   ├── components/          # Reusable components
│   │   ├── ui/              # ShadCN UI components
│   │   ├── admin/           # Admin-specific components
│   │   └── team/            # Team member components
│   ├── utils/               # Utility functions
│   └── package.json
└── README.md
```

## 🔐 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- File type validation
- File size limits (5MB)
- Rate limiting on API endpoints
- CORS protection
- Input validation and sanitization

## 📧 Email Configuration

The system uses Gmail SMTP for sending notifications. To set up:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Use the App Password in the `EMAIL_PASS` environment variable

## 🗄 Database Schema

The system uses the following main entities:

- **Admins** - Super admins and document admins
- **Teams** - Competition teams with unique IDs
- **TeamMembers** - Individual team members
- **Documents** - Uploaded documents with status tracking
- **Notifications** - System notifications

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Change password

### Admin (Super Admin only)
- `POST /api/admin/teams` - Create team
- `GET /api/admin/teams` - Get all teams
- `POST /api/admin/teams/:teamId/members` - Add team member

### Documents
- `POST /api/documents/upload` - Upload document (Team Member)
- `GET /api/documents` - Get all documents (Admin)
- `PUT /api/documents/:id/approve` - Approve document (Admin)
- `PUT /api/documents/:id/reject` - Reject document (Admin)

## 🔄 Development Workflow

1. Make changes to the code
2. Test locally with both frontend and backend running
3. Check database changes with Prisma Studio: `npx prisma studio`
4. Run linting: `npm run lint`
5. Build for production: `npm run build`

## 📝 Environment Variables

### Backend Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT token signing
- `CLOUDINARY_*` - Cloudinary configuration
- `EMAIL_*` - Email service configuration

### Frontend Required Variables
- `NEXT_PUBLIC_API_URL` - Backend API URL

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify DATABASE_URL is correct
   - Ensure database exists

2. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper file types

3. **Email Not Sending**
   - Verify Gmail App Password
   - Check SMTP settings
   - Ensure 2FA is enabled on Gmail

## 📈 Production Deployment

### Backend Deployment
1. Set NODE_ENV=production
2. Use a production PostgreSQL database
3. Configure proper CORS origins
4. Set up SSL certificates
5. Use a process manager like PM2

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or similar
3. Set production environment variables
4. Configure domain and SSL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for IWC Team Management**
