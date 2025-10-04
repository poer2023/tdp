# User Guide

Guide for blog readers.

## Table of Contents

- [Reading Content](#reading-content)
- [Language Switching](#language-switching)
- [Liking Posts](#liking-posts)
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

<!-- Commenting feature has been removed. -->

---

## Account Management

### Profile Information

Your profile is managed by Google. If you are an admin, you'll use Google to sign in to the dashboard.

### Signing Out

1. Click your profile picture in the top-right corner
2. Click **"Sign out"**
3. You're signed out and redirected to the homepage

### Deleting Your Data

To request deletion of your profile data:

1. Contact the site administrator via email (see footer)
2. Provide your email address used for sign-in
3. Administrator will delete your profile data from the system
4. Deletion is permanent and cannot be undone

**Processing time**: Within 7 days

---

## Tips for a Great Experience

### Liking Posts

- Like posts you find valuable to help others discover quality content
- Likes are anonymous, so feel free to engage freely

### Language Switching

- Check for the language switcher to read posts in your preferred language
- Not all posts have translations—English content is typically more complete

### Reporting Issues

If you encounter problems:

- **Technical issues**: Broken links, loading errors

- **Accessibility**: Features not working with assistive technology

Contact: admin@example.com (replace with actual contact)

---

## Frequently Asked Questions

### Can I like a post multiple times?

No. You can only like each post once per day from your current browser session.

### How do I change my profile picture?

Profile pictures come from your Google account. Update your Google profile picture, and it will automatically reflect on the blog.

### Why don't all posts have translations?

Translation is a manual process. Not all content has been translated yet. Check for the language switcher to see if a translation is available.

### Is my email address public?

No. Your email is only visible to administrators for identification purposes.

---

## Support

For help with:

- **Technical issues**: Report via contact form or email
- **Account problems**: Contact administrator
- **Content suggestions**: Use contact email
- **Privacy concerns**: See [Privacy Policy](./PRIVACY_POLICY.md)

Thank you for being part of our community!
