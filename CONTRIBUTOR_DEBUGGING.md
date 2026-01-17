# Contributor Debugging Playground

A comprehensive guide for contributors to debug and troubleshoot common issues in the GrindMap project.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Common Issues & Solutions](#common-issues--solutions)
3. [Frontend Debugging](#frontend-debugging)
4. [Backend Debugging](#backend-debugging)
5. [Scraper Debugging](#scraper-debugging)
6. [Database Issues](#database-issues)
7. [Development Tools](#development-tools)
8. [Tips & Best Practices](#tips--best-practices)

---

## Environment Setup

### Prerequisites

- **Node.js**: v14 or higher
- **Python**: v3.8 or higher
- **MongoDB**: Running locally or via cloud service
- **Git**: For version control

### Initial Setup Troubleshooting

#### Problem: `npm install` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and lock files
rm -r node_modules package-lock.json

# Reinstall dependencies
npm install
```

#### Problem: Python dependencies not installing

**Solution:**
```bash
# Ensure pip is up to date
python -m pip install --upgrade pip

# Install from requirements.txt with verbose output
pip install -r requirements.txt -v

# If specific package fails, install individually
pip install package_name==version
```

#### Problem: MongoDB connection fails

**Solution:**
```bash
# Check if MongoDB is running
# Windows: Open Task Manager and look for mongod.exe
# Linux/Mac: ps aux | grep mongod

# Start MongoDB service
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod
# Mac: brew services start mongodb-community

# Test connection
mongo mongodb://localhost:27017
```

---

## Common Issues & Solutions

### Issue: Port Already in Use

**Problem:** Server fails to start because port 5000 (or 3000) is already in use.

**Solution:**
```bash
# Find process using the port (Windows)
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <process_id> /F

# Or change the port in your .env file
PORT=5001
```

### Issue: CORS Errors

**Problem:** Frontend requests to backend are blocked with CORS error.

**Solution:**
1. Check `backend/src/app.js` for CORS configuration
2. Ensure frontend URL is in the CORS whitelist
3. Verify the backend is running on the correct port
4. Check browser console for the exact error

```javascript
// Example CORS fix in app.js
const cors = require('cors');
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true
}));
```

### Issue: Environment Variables Not Loaded

**Problem:** Application crashes because required env variables are missing.

**Solution:**
1. Create `.env` file in backend root directory
2. Copy from `.env.example` if available
3. Ensure variables match what's used in `config/env.js`
4. Restart the server after adding variables

**Key Environment Variables:**
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/grindmap
JWT_SECRET=your_secret_key_here
```

---

## Frontend Debugging

### Problem: Component Not Rendering

**Solution:**
1. Check browser DevTools (F12) for JavaScript errors
2. Verify component import paths are correct
3. Check React DevTools to see component hierarchy
4. Ensure all required props are being passed

### Problem: API Calls Failing

**Solution:**
```javascript
// Add console logging to track API calls
console.log('Request:', url, method);

// Check Network tab in DevTools
// Look for:
// - Status code (should be 2xx for success)
// - Response body
// - Request headers

// Verify backend is running
// Check CORS headers are present
```

### Problem: CSS Not Applying

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Check CSS file is imported correctly
3. Verify class names match between HTML and CSS
4. Check CSS specificity (use !important as last resort)
5. Reload with hard refresh (Ctrl+Shift+R)

### Debugging Frontend with DevTools

```javascript
// Add breakpoints in Sources tab
// Use console.log strategically
console.log('Component state:', this.state);
console.log('API response:', response);

// Use React DevTools extension for component inspection
// Use Redux DevTools if using Redux for state management
```

---

## Backend Debugging

### Problem: Route Not Found (404 Error)

**Solution:**
1. Verify route is defined in `routes/` directory
2. Check route path syntax and HTTP method (GET, POST, PUT, DELETE)
3. Ensure route file is imported in `app.js`
4. Check middleware order (error handling should be last)

```javascript
// Example route setup in app.js
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);
```

### Problem: Authentication Token Issues

**Solution:**
```bash
# Check JWT token in browser localStorage
# Open DevTools > Application > LocalStorage

# Test token validity
# Decode JWT at jwt.io to see contents

# Verify token is being sent in Authorization header
# Check Network tab: Headers > Authorization: Bearer <token>
```

### Problem: Middleware Not Executing

**Solution:**
1. Check middleware is registered before the route
2. Verify middleware calls `next()` to pass control
3. Ensure middleware paths match request paths
4. Check middleware function signature: `(req, res, next) => {}`

```javascript
// Correct middleware implementation
app.use((req, res, next) => {
    console.log('Request:', req.method, req.url);
    next(); // Important: call next() to continue
});
```

### Problem: Database Queries Returning Empty

**Solution:**
```javascript
// Add logging to service methods
console.log('Query:', query);
console.log('Result:', result);

// Check MongoDB directly
// Use MongoDB Compass or mongo shell
db.activities.find({})

// Verify indexes exist for frequently queried fields
// Check data types match (string vs ObjectId)
```

### Debugging Backend with Console Logs

```javascript
// Use logger utility
const logger = require('../utils/logger.util');

logger.info('User logged in:', userId);
logger.error('Database error:', error);
logger.debug('Query details:', query);

// Enable debug logging
// Set DEBUG environment variable
// DEBUG=* npm start
```

---

## Scraper Debugging

### Problem: Scraper Returns No Data

**Solution:**
1. Check if the target platform website structure changed
2. Verify username exists on the platform
3. Check rate limiting isn't blocking requests
4. Review Puppeteer selectors are still valid

```javascript
// Test scraper directly
node scripts/testScrapers.js <platform> <username>

// Add debug logging to scraper
console.log('Page loaded:', page.url());
console.log('HTML content:', await page.content());
```

### Problem: Puppeteer Timeout

**Solution:**
```javascript
// Increase timeout in scraper
const options = {
    timeout: 30000, // 30 seconds
    waitUntil: 'networkidle2'
};

// Check if website has JavaScript heavy loading
// May need to wait for specific elements
await page.waitForSelector('.data-container', { timeout: 5000 });
```

### Problem: Selector Not Finding Elements

**Solution:**
```javascript
// Test selector in browser console
document.querySelector('selector')

// Take a screenshot for manual inspection
await page.screenshot({ path: 'debug.png' });

// Log page content to see actual HTML
console.log(await page.content());

// Use page.evaluate to run JS in browser context
const data = await page.evaluate(() => {
    return document.querySelector('selector')?.textContent;
});
```

### Common Scraper Issues

| Platform | Common Issue | Solution |
|----------|--------------|----------|
| **LeetCode** | Dynamic content loading | Wait for React to render |
| **Codeforces** | Session-based scraping | Use cookies/session storage |
| **GitHub** | Rate limiting | Use GitHub API with auth token |
| **CodeChef** | JavaScript rendering | Use Puppeteer with headless:false |
| **AtCoder** | Selector changes | Update selectors in scraper |

---

## Database Issues

### Problem: Connection Pool Exhausted

**Solution:**
```javascript
// Check MongoDB connection settings in config/db.js
// Verify connection string is correct
// Monitor active connections
// Close connections properly in cleanup

// Limit concurrent connections
mongoose.set('maxPoolSize', 10);
```

### Problem: Data Corruption or Inconsistency

**Solution:**
```bash
# Backup database before making changes
mongodump --db grindmap --out ./backup

# Verify data integrity
db.activities.find({userId: ObjectId("...")})

# Use transactions for multiple operations
session = db.getMongo().startSession();
session.startTransaction();
```

### Problem: Slow Database Queries

**Solution:**
```javascript
// Use explain() to check query performance
db.activities.explain('executionStats').find({userId: userId})

// Create indexes for frequently queried fields
db.activities.createIndex({userId: 1, date: -1})

// Check index usage
db.activities.getIndexes()
```

---

## Development Tools

### Useful Commands

```bash
# Backend
cd backend

# Start development server with nodemon
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Frontend
cd ../frontend

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

### Browser DevTools Features

1. **Console Tab**: View logs and errors
2. **Network Tab**: Monitor API requests
3. **Application Tab**: View localStorage, cookies, IndexedDB
4. **Sources Tab**: Set breakpoints and debug
5. **Performance Tab**: Profile application performance

### VS Code Extensions for Debugging

Recommended extensions:
- **Debugger for Chrome**: Debug frontend code
- **Debugger for Firefox**: Debug in Firefox
- **MongoDB for VS Code**: MongoDB database exploration
- **REST Client**: Test API endpoints
- **Thunder Client**: API testing alternative

---

## Tips & Best Practices

### 1. Use Version Control

```bash
# Create feature branch before making changes
git checkout -b feature/your-feature-name

# Commit frequently with clear messages
git commit -m "fix: correct selector in leetcode scraper"

# Push and create pull request
git push origin feature/your-feature-name
```

### 2. Enable Debug Mode

```bash
# Backend debugging
DEBUG=grindmap:* npm run dev

# Frontend debugging
REACT_APP_DEBUG=true npm start
```

### 3. Use Logger Utility

```javascript
// Instead of console.log, use the logger
const logger = require('../utils/logger.util');

logger.info('Information');
logger.warn('Warning');
logger.error('Error');
logger.debug('Debug info');
```

### 4. Test Changes Locally

```bash
# Test scraper with specific user
npm run test:scraper -- leetcode testuser

# Test API endpoint
curl http://localhost:5000/api/user/profile

# Test with different data
```

### 5. Check Logs

```bash
# Backend logs
tail -f logs/app.log

# Browser console logs
# Open DevTools (F12) > Console tab

# System logs
# Check system event viewer on Windows
```

### 6. Isolate Changes

- Modify one file at a time
- Test after each change
- Use Git branches for features
- Keep commits focused and small

### 7. Read Error Messages Carefully

- Error messages often contain the solution
- Stack traces show where the error occurred
- Network responses show exact error details
- Don't ignore warnings

### 8. Collaborate with Team

- Ask questions in discussions
- Share findings with team
- Document solutions you discover
- Help other contributors

---

## Quick Troubleshooting Checklist

- [ ] Is the development server running?
- [ ] Are all environment variables set?
- [ ] Is MongoDB running and accessible?
- [ ] Did you clear browser cache?
- [ ] Did you install all dependencies?
- [ ] Are you on the latest code from main branch?
- [ ] Did you check the browser console for errors?
- [ ] Did you check the network tab for failed requests?
- [ ] Did you try restarting the server?
- [ ] Did you check the error logs?

---

## Getting Help

1. **Check existing issues**: Search GitHub issues for similar problems
2. **Read documentation**: Check README.md and existing docs
3. **Ask in discussions**: Use GitHub Discussions for questions
4. **Debug systematically**: Follow the steps in this guide
5. **Share findings**: Help other contributors by documenting solutions

---

## Contributing Improvements

If you discover new issues or solutions, please:
1. Create an issue describing the problem
2. Submit a PR to improve this document
3. Share your debugging experience with the team

Good luck debugging! Happy contributing! 🚀
