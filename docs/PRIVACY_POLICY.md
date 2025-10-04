# Privacy Policy

Last updated: 2024

## Overview

This privacy policy describes how we collect, use, and protect your personal information when you use our blog.

## Information We Collect

### 1. Authentication Data (Google Sign-In)

When you sign in with Google, we collect:

- **Name**: Your Google account display name
- **Email**: Your Google account email address
- **Profile Picture**: Your Google account profile picture URL (optional)

**Why we collect it**: To authenticate administrators for the dashboard and manage sessions.

**How we use it**:

- Verify admin access权限
- Manage your authenticated session

**Storage**: Stored in our secure database

### 2. Like Tracking (Session-Based)

When you like a post, we collect:

- **Session Key Hash**: A SHA-256 hash of a random session identifier stored in your browser cookie
- **Post ID**: Which post you liked
- **Timestamp**: When you liked the post

**Why we collect it**: To prevent duplicate likes and display accurate like counts.

**How we use it**:

- Enforce one like per session per day
- Calculate total like counts per post
- No personally identifiable information is stored

**Storage**:

- Session key (plaintext): HTTP-only cookie in your browser
- Session key hash: Stored in our database (one-way hashed, cannot be reversed)

**Anonymity**: We cannot link hashed session keys back to your identity or IP address.

<!-- Comments feature removed. -->

### 4. Server Logs (Temporary)

Our web server may temporarily log:

- **Request URLs**: Pages you visit
- **Referrer**: Where you came from
- **Timestamp**: When you visited

**Why we collect it**: To monitor system health and diagnose technical issues.

**How we use it**:

- Troubleshoot errors and performance issues
- Monitor for malicious activity (DDoS, abuse)

**Storage**: Server logs are rotated and deleted after 7-14 days

**Note**: Server logs are not linked to your user account or identity.

## What We Do NOT Collect

- **Full IP Addresses**: Only SHA-256 hashes (if enabled), never plaintext
- **Browsing History**: We don't track which pages you visit over time
- **Social Media Activity**: We only access basic Google profile info, not your Google activity
- **Payment Information**: We don't collect any financial data (no transactions)
- **Cookies for Tracking**: We use cookies only for session management and authentication, not for advertising or analytics
- **Device Fingerprinting**: We don't attempt to uniquely identify your device

## How We Use Your Information

### Authentication

- Identify you as a signed-in administrator
- Manage your session (keep you signed in)

### Like Functionality

- Prevent duplicate likes from the same session
- Display accurate like counts on posts

### Security and Spam Prevention

- Detect and prevent spam patterns (using hashed data)
- Investigate abuse and malicious activity

### System Maintenance

- Monitor system health and performance
- Diagnose and fix technical issues
- Ensure availability and reliability

## Data Sharing

We **do not sell, rent, or share** your personal information with third parties, except:

### Google OAuth

- We use Google's OAuth service for authentication
- Google's privacy policy applies: https://policies.google.com/privacy
- We only request minimal scopes: profile and email

### Legal Compliance

- We may disclose information if required by law, court order, or legal process
- We may disclose information to protect our rights, safety, or property
- We may disclose information to investigate fraud or abuse

### Service Providers

- We may use cloud hosting services (e.g., Vercel, AWS) to store data
- Service providers are bound by confidentiality agreements
- Service providers only access data necessary to provide services

## Data Security

We implement security measures to protect your data:

### Encryption

- **In Transit**: All connections use HTTPS (TLS 1.2+)
- **At Rest**: Database encryption (provider-dependent)
- **Passwords**: We don't store passwords (Google handles authentication)

### Hashing

- Session keys are SHA-256 hashed before storage
- IP addresses are SHA-256 hashed (if collected)
- User agents are SHA-256 hashed (if collected)
- Hashes are one-way and cannot be reversed

### Access Control

- Only authorized administrators can access user data
- Database access restricted to application services

### Monitoring

- We monitor for unauthorized access attempts
- We log admin actions for audit purposes
- We regularly review security practices

## Your Rights

### Access

You can request a copy of your data by contacting us at: admin@example.com (replace with actual contact)

### Correction

If your profile information is incorrect, update it in your Google account settings.

### Deletion

You can request deletion of your data:

1. Contact us at: admin@example.com
2. Provide your email address used for sign-in
3. We will delete your profile information and associated hashed security data
4. Processing time: Within 7 days

**Note**: Deletion is permanent and cannot be undone.

### Opt-Out

- **Likes**: Don't click like buttons (no tracking if you don't interact)

- **Cookies**: You can clear cookies in your browser settings (will sign you out)

## Cookies

We use cookies for essential functionality only:

### Session Cookie (Authentication)

- **Name**: `next-auth.session-token`
- **Purpose**: Keep you signed in
- **Expiration**: 30 days or when you sign out
- **Type**: HTTP-only, Secure

### Session Cookie (Like Tracking)

- **Name**: `session-key`
- **Purpose**: Prevent duplicate likes
- **Expiration**: Session (browser close)
- **Type**: HTTP-only, Secure

### CSRF Cookie

- **Name**: `next-auth.csrf-token`
- **Purpose**: Prevent cross-site request forgery attacks
- **Expiration**: Session
- **Type**: HTTP-only, Secure

We **do not use** cookies for:

- Advertising
- Analytics tracking
- Cross-site tracking
- Third-party tracking

## Children's Privacy

Our blog is not directed at children under 13 years of age. We do not knowingly collect personal information from children under 13.

If you believe a child under 13 has provided us with personal information, please contact us immediately, and we will delete the information.

## Data Retention

### Like Data

- Session key hashes stored indefinitely for like counting
- Cannot be linked back to your identity

### Authentication Data

- Stored as long as you have an account
- Deleted when you request data deletion

### Server Logs

- Rotated and deleted after 7-14 days

## International Data Transfers

Our services may be hosted on servers in various countries. By using our blog, you consent to the transfer of your data to these locations.

We ensure that service providers handling your data comply with applicable data protection laws.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be posted on this page with an updated "Last updated" date.

Significant changes will be announced on the blog homepage.

Continued use of the blog after changes constitutes acceptance of the new policy.

## Contact Us

For questions, concerns, or data requests:

**Email**: admin@example.com (replace with actual contact)

**Response time**: Within 7 days

---

## Summary (TL;DR)

**What we collect**:

- Your Google name, email, and profile picture when you sign in (admins)
- Hashed session keys for like tracking (anonymous)
- Optional: Hashed IP and user agent for security

**What we don't collect**:

- Full IP addresses (only hashes if enabled)
- Browsing history
- Payment information
- Device fingerprints

**How we use it**:

- Authenticate administrators and manage sessions
- Prevent duplicate likes
- Enforce rate limits

**Your rights**:

- Request a copy of your data
- Request deletion of your data (permanent)
- Contact us with concerns

**Security**:

- HTTPS encryption for all connections
- One-way hashing for session keys, IPs, and user agents
- No plaintext storage of sensitive data
- Admin-only access to user data

**Cookies**:

- Used only for authentication and like tracking
- No advertising or analytics cookies
- HTTP-only and Secure flags set

**Contact**: admin@example.com for any privacy concerns

---

Thank you for trusting us with your information. We take your privacy seriously.
