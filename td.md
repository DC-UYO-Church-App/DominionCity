PRD (Product Requirements Document) for the
Dominion City Church (Golden Heart) Church App
project:
Project Overview
Objective: To develop a comprehensive web application that streamlines church
operations, improves communication, tracks attendance and engagement, and
enhances administrative efficiency for Dominion City Uyo (Golden Heart) Church.
Core Users:
1.
2.
3.
4.
5.
Church Admins
Church Workers
Church Members
Cell Leaders
Pastors/HODs
Functional Requirements
1. User Management and Authentication
User Login: Allow church workers and members to log in with unique credentials.
Role-based Access:
Admin: Access to full database of members, attendance tracking, and
◦
reporting.
Pastors/HODs: Access to their department members’ data, attendance, and
◦
communication tools.
Cell Leaders: Access to the cell group members and ability to send group
◦
messages.
2. Attendance and First-Timer Detection
•
•
Attendance Sign-In: Digital sign-in for all church attendees and workers.
First-Time Visitor Detection: Automatically identify and track first-time visitors.
Special Welcome Message: Send an automated welcome message to first-timers.
Notification for Absence:
If a member misses 2-3 services, an automated message will be sent.
◦
If a member misses over a month, the Admin or HOD will be notified to follow
◦
up personally.
3. Birthday and Special Occasion Messages
•
•
•
•
•
•
Automated Birthday Messages: Send personalised birthday messages at midnight.
Event Reminders: Automatically remind members about upcoming meetings,
events, and special services.4. Member Tracking for Church Programs
•
•
Track Completion of Classes: Record and track members’ completion of Dominion
City foundational classes (DCA Basic, DCA Advance, Encounter, DLI Basic, DLI
Advance).
Admin View: Admins can see all members' progress in church programs upon login.
5. Cell Group Management and Communication
•
•
•
Cell Center Locator: Show nearest cell centre based on a member’s location.
Cell Meeting Details: Display meeting days and points for each cell.
Communication for Cell Leaders: Enable cell leaders to send group messages,
reminders, and updates to cell members.
6. Tithing and Financial Tracking
•
•
•
•
Tithe Tracking: Record tithing frequency (daily, weekly, monthly) and consistency.
Reminder Notifications:
If a member misses tithe payments twice, send a reminder.
◦
If payments are consistently missed, notify the pastor in charge for follow-up.
◦
Kingdom Project and Welfare Reminders: Set reminders for members who have
pledged contributions toward kingdom projects or church welfare initiatives.
A payment method for receiving and generating receipts for each user.
7. Church Content Library
•
•
•
Sermon Archive: Access to recordings of sermons, tapes and Books by Pastor
David Ogbueli, including Sunday services and weekly sermons.
Sermon Archive: Access to recordings of sermons by Pastor Nonso Agu, including
Sunday services and weekly sermons.
Media Integration: Ability to upload, view, and download sermons, categorised by
date or event.
8. Member Absence Notifications
•
Attendance Monitoring:
Automatic alerts sent if a member misses 2-3 services.
◦
HODs are notified if members in their department miss consecutive Sundays.
◦
9. Department and HOD Management•
•
•
Department Overview: Each HOD has access to monitor member attendance and
engagement within their department.
Attendance Tracking: View member attendance status, arrival time, and
consecutive absences.
Follow-Up: Allow HODs to personally follow up with absent members.
10. Travel Notification and Approval
•
•
Travel Approval Workflow:
Church workers can notify the Admin or Pastor about travel plans via the
◦
app’s comments section.
Approval System: Pastors and HODs can review and approve travel
◦
requests.
Automated Travel Blessing: Upon approval, a prayer message is sent to the
◦
traveler for a safe journey.
Urgent Notification: Option for members to mark travel as urgent, allowing for
immediate communication with the Pastor.
11. In App Chatting System.
• An in-Built messaging app that connects members together.
Non-Functional Requirements
1. Security:
◦
◦
Secure user authentication and role-based access control.
Data encryption for sensitive information such as tithing records and
attendance.
2. Performance:
◦
◦
Efficient data handling for large membership bases.
Timely sending of reminders and notifications.
3. Usability:
◦
◦
Intuitive user interface with clear navigation for non-technical users.
Notification management for effective reminders without overwhelming users.

Integration with SMS/Email APIs for automated notifications.
GPS and Location Services for Cell Center tracking.
Deliverables
Mobile Application (iOS and Android)
Admin Dashboard: Web interface for Admin and HOD access.
Attendance and Tracking System: Hardware and software setup for attendance.
Automated Noti cation System: Integrated with birthdays, absence tracking, and
tithing notifications.
Documentation: User and technical documentation for app usage and system
maintenance.


Technical Requirements
1. Hardware Requirements:
◦
2 Computers: For database management by Admins and other roles.◦
◦
◦
4-8 Cameras: Equipped with solar panels, SIM, and WiFi for monitoring
purposes.
Thumb-printing Machines: 2 solar-powered machines for attendance
verification.
Modem: Solar-powered modem with SIM and WiFi capability for internet
access.
2. Software Stack:
◦
◦
◦
Mobile Application (iOS/Android) for church members and workers.
Backend Server: Secure API for handling data operations and authentication.
Database: Centralised member database with support for role-based data
access.
3. Integration and APIs:
◦
◦
Integration with SMS/Email APIs for automated notifications.
GPS and Location Services for Cell Center tracking.
Deliverables
Mobile Application (iOS and Android)
Admin Dashboard: Web interface for Admin and HOD access.
Attendance and Tracking System: Hardware and software setup for attendance.
Automated Noti cation System: Integrated with birthdays, absence tracking, and
tithing notifications.
Documentation: User and technical documentation for app usage and system
maintenance.
1.
2.
3.
4.
5.
Timeline and Milestones
1. Requirement Gathering - 2 weeks
2. Design & Prototyping - 3 weeks
3. Development Phase - 3 months
◦ Core Features: Authentication, Attendance, Messaging
◦ Member Tracking: Program completion, Cell Center, Tithing
◦ Noti cation System: Birthdays, Absences, and Travel Approvals
4. Testing & QA - 4 weeks
5. Deployment - 1 week
6. Training & Documentation - 2 weeks
Success Metrics
User Engagement: Measure member and worker activity levels on the app.
1.2.
Improvement in Attendance: Track the attendance rate improvement over
time.
Operational Ef ciency: Evaluate time saved on administrative and follow-up
tasks.
Positive Feedback: Member and staff feedback on ease of use and app utility.
3.
4.
This PRD outlines the essential features, technical requirements, and milestones for
developing the Dominion City Uyo Church app, ensuring it serves as a practical,
user-friendly tool for church administration, communication, and community
engagement.
NOTE: Future adjustments will still be made and there’s room for adding extra features.


The admin can assign cell group role to anybody, assign cell group name and the leader profile will be showing on any of their members cell group page

Roles that the super-admin can assign to users, "Pastor, Cell leader [cell name], Department Leader [Department name],

Think of creating departments, groups or positions

Cell group leader can send broadcast message to it's cell members

DCA part

Church branches[City pastors][chapter pastors]
Integrate whatsapp notification
Ongoning projects
Programs - National Programs, State Programs
Weekly Activites
Satlite Churches

---- Start Here ---
Ongoing project section in the admin dashboard, the admin can upload the lists of ongoing projects. On each project there will be a an amount given section for the project, lists of users that particular gave for the project. In the users dashboard, the users sees the ongoing project section and they can give to support. There will also an option to give annonymously. The payment method for now will be manual, when a user makes payment they can click I've paid button and it'll be updated when the admin confirms it.

Change the Events page to Programs. Then their will be a section for national programs and State programs, the admin uploads and programs and it appears on the users page, there will also be a "Support Program" button for giving for the program, users can select the option of give annonymosly.

Weekly Activites. The admin uploads the weekly activites program and it appears in the activities section in the users dashboard.

Giving Page. In the Admin page, It will consist the total amount that they gave to the church, sections of amount given to different projects and programs. Sections for top 10 givers and list of givers.

Satelite Churches: The Admin super-admin has a page that's called "Satelite Churches" the super admin creates a satelite church and assign it to any member, the page will show on the members (the one that the role was assigned to) dashboard there'll be a button that says "Visit my Satelite Dashboard" With time we will work on this satelite section well.