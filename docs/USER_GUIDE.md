# User Guide

Guide for blog readers and commenters.

## Table of Contents

- [Reading Content](#reading-content)
- [Language Switching](#language-switching)
- [Liking Posts](#liking-posts)
- [Commenting](#commenting)
- [Account Management](#account-management)

---

## Reading Content

### Finding Posts

**Homepage**: Visit the root URL to see all posts

- English version: `/`
- Chinese version: `/zh`

**Post URLs**:

- English: `/posts/{slug}`
- Chinese: `/zh/posts/{slug}`

### Post Features

Each post includes:

- **Title and excerpt**: Quick overview
- **Published date**: When the post was published
- **Tags**: Topic categories
- **Like button**: Show appreciation (no login required)
- **Comments section**: Join the discussion (login required)
- **Language switcher**: Access translations (if available)

---

## Language Switching

### Finding the Language Switcher

Located near the top of each post, the language switcher appears when translations are available.

**Example:**

```
English | 中文
```

### How It Works

1. Click on the desired language
2. You're redirected to the same post in that language
3. If no translation exists, the switcher is hidden or shows "Translation not available"

### URL Structure

- **English posts**: `/posts/hello-world`
- **Chinese posts**: `/zh/posts/ni-hao-shi-jie`

Translations of the same post may have different slugs but share the same content and topic.

---

## Liking Posts

### How to Like

1. Scroll to the like button (usually below the post content)
2. Click the button
3. The count increments immediately
4. Button becomes disabled (you've already liked this post)

### Like Limitations

**Session-based**: One like per session per day

- Uses browser cookies to track your like
- No login required
- Anonymous and privacy-preserving

**Rate limiting**: 10 likes per minute across all posts

- Prevents abuse
- Normal usage unaffected

### Like Count Display

```
❤️ 42 likes
```

Shows total number of likes the post has received.

### Privacy

- Your like is tracked via a hashed session key
- No personal information is stored
- No IP addresses are logged
- Session keys are salted and one-way hashed (SHA-256)

---

## Commenting

### Requirements

**Login required**: You must sign in with Google to comment.

### Signing In

1. Click **"Sign in with Google"** in the top-right corner
2. Authorize the blog to access your basic profile (name, email, profile picture)
3. You're redirected back to the page you were viewing

### Posting a Comment

1. Scroll to the comments section
2. Enter your comment in the text box (max 2000 characters)
3. Click **"Submit"**
4. Your comment enters moderation (first-time commenters only)

### First-Time Commenters

**Moderation queue**: Your first comment waits for approval.

```
Your comment is awaiting moderation.
It will appear once approved by an administrator.
```

**Typical approval time**: Within 24 hours

### Returning Commenters

**Auto-approval**: Once you have one approved comment, future comments are published immediately.

```
Your comment has been posted!
```

No waiting for approval.

### Replying to Comments

1. Find the comment you want to reply to
2. Click **"Reply"**
3. A reply form appears
4. Enter your reply and submit
5. Your reply appears nested under the original comment

**Threading**: One level deep (you can reply to top-level comments, but not to replies)

### Comment Limitations

**Rate limits**:

- 3 comments per 5 minutes
- 20 comments per day

These limits prevent spam while allowing normal discussion.

### Comment Formatting

Comments support plain text with line breaks.

**Allowed**:

- Line breaks (press Enter)
- Paragraphs (double Enter)
- Links (auto-detected)

**Not allowed**:

- HTML tags (stripped for security)
- Markdown formatting
- Images or embeds

### Editing and Deleting Comments

**Currently not supported**: Once posted, comments cannot be edited or deleted by users.

If you need a comment removed:

1. Contact the site administrator
2. Provide the comment URL or content
3. Admin can hide or delete the comment

### Comment Moderation

Administrators review comments for:

- **Spam**: Promotional content, irrelevant links
- **Abuse**: Personal attacks, harassment
- **Policy violations**: Hate speech, illegal content

**Actions**:

- **Approve**: Comment becomes visible
- **Hide**: Comment removed from public view
- **Delete**: Comment permanently removed

### Privacy

**What we store**:

- Your Google profile name and email
- Your comment content
- Timestamp
- Post association
- Optional: Hashed IP and user agent (for security)

**What we don't store**:

- Your full IP address (only hashed if enabled)
- Your browsing history
- Your Google account password

See [Privacy Policy](./PRIVACY_POLICY.md) for details.

---

## Account Management

### Profile Information

Your profile is managed by Google. We only access:

- **Name**: Displayed with your comments
- **Email**: Used for identification (not publicly shown)
- **Profile picture**: Displayed with your comments (optional)

### Signing Out

1. Click your profile picture in the top-right corner
2. Click **"Sign out"**
3. You're signed out and redirected to the homepage

### Deleting Your Data

To request deletion of your comments and profile data:

1. Contact the site administrator via email (see footer)
2. Provide your email address used for sign-in
3. Administrator will delete all your comments and profile data
4. Deletion is permanent and cannot be undone

**Processing time**: Within 7 days

---

## Tips for a Great Experience

### Liking Posts

- Like posts you find valuable to help others discover quality content
- Likes are anonymous, so feel free to engage freely

### Commenting

- **Be respectful**: Treat others as you'd like to be treated
- **Stay on topic**: Keep comments relevant to the post
- **Add value**: Share insights, ask questions, or provide helpful resources
- **Be patient**: First-time comments need approval (24-hour turnaround)
- **Engage thoughtfully**: Reply to other comments to start discussions

### Language Switching

- Check for the language switcher to read posts in your preferred language
- Not all posts have translations—English content is typically more complete

### Reporting Issues

If you encounter problems:

- **Technical issues**: Broken links, loading errors
- **Content concerns**: Inappropriate comments, spam
- **Accessibility**: Features not working with assistive technology

Contact: admin@example.com (replace with actual contact)

---

## Frequently Asked Questions

### Can I comment without signing in?

No. Comments require Google sign-in to prevent spam and maintain quality discussions.

### Why is my comment awaiting moderation?

First-time commenters' first comment requires approval. This helps prevent spam and abuse. Once you have one approved comment, future comments are auto-approved.

### Can I like a post multiple times?

No. You can only like each post once per day from your current browser session.

### How do I change my profile picture?

Profile pictures come from your Google account. Update your Google profile picture, and it will automatically reflect on the blog.

### Can I edit my comment after posting?

Not currently. If you need to correct a comment, you can post a follow-up reply.

### Why don't all posts have translations?

Translation is a manual process. Not all content has been translated yet. Check for the language switcher to see if a translation is available.

### Is my email address public?

No. Your email is only visible to administrators for identification purposes. Other users only see your name and profile picture.

### How long are comments stored?

Comments are stored indefinitely unless you request deletion or they're removed by administrators for policy violations.

---

## Support

For help with:

- **Technical issues**: Report via contact form or email
- **Account problems**: Contact administrator
- **Content suggestions**: Use comments or contact email
- **Privacy concerns**: See [Privacy Policy](./PRIVACY_POLICY.md)

Thank you for being part of our community!
