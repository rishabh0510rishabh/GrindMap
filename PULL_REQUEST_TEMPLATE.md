📌 Description
This PR adds an interactive demo feature and visual preview infrastructure to GrindMap, allowing users to explore the application's capabilities without setting up their own accounts. The feature improves onboarding, engagement, and provides immediate value to new users by showcasing real-world usage with sample data.

Key Features:

New DemoPage.js component with realistic sample data from all platforms
Toggle between demo and live mode with seamless navigation
Enhanced UI with demo banner and professional styling
Comprehensive documentation for demo usage and visual assets
Infrastructure for screenshots and video previews
Sample data includes LeetCode (487 problems), CodeForces (Expert rank), and CodeChef (4-star)
Fixes: #[issue-number]

🔧 Type of Change
Please mark the relevant option(s):

☐ 🐛 Bug fix
☑ ✨ New feature
☑ 📝 Documentation update
☐ ♻️ Refactor / Code cleanup
☐ 🎨 UI / Styling change
☐ 🚀 Other (please describe):

🧪 How Has This Been Tested?
Describe the tests you ran to verify your changes.

☑ Manual testing
☐ Automated tests
☐ Not tested (please explain why)

Testing performed:

Tested demo page renders correctly with all platform data
Verified toggle between demo and live mode works seamlessly
Confirmed all platform cards display sample statistics accurately
Tested expandable cards show detailed information (difficulty breakdown, ratings, ranks)
Verified activity heatmap renders with 365 days of sample data
Tested responsive design on different screen sizes
Confirmed "Back to Main" button navigation works properly
Verified demo banner displays with gradient styling
Tested circular progress indicators calculate percentages correctly
Confirmed today's activity tracker shows all platforms as active

📸 Screenshots
(Screenshots will be added following SCREENSHOT_GUIDE.md instructions)

✅ Checklist
Please confirm the following:

☑ My code follows the project's coding style
☑ I have tested my changes
☑ I have updated documentation where necessary
☑ This PR does not introduce breaking changes

📝 Additional Notes

Features Added:

frontend/src/components/DemoPage.js: Interactive demo component with sample data
Updated frontend/src/App.js: Added demo toggle and conditional rendering
Updated frontend/src/App.css: Demo banner styles and enhanced UI
DEMO.md: Comprehensive guide for using the interactive demo
SCREENSHOT_GUIDE.md: Instructions for adding visual assets and screenshots
public/screenshots/README.md: Directory structure for visual previews
Updated README.md: Added Interactive Demo section with detailed instructions

Technical Details:

Demo data includes realistic statistics from all three platforms
generateDemoCalendar() function creates 365 days of activity data
Circular progress calculations for LeetCode (16%), CodeForces (44%), CodeChef (63%)
Total solved problems: 955 across all platforms
No API calls required in demo mode - fully client-side
Maintains all existing functionality without breaking changes
Demo state managed with React useState hook
Seamless user experience with clear navigation between modes
