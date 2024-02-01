# FakeMates™ - A Social Media Sensation\*

\* **Note**: not a verified - nor a credible - claim.

<figure style="text-align: center;">
  <img src="showcase.gif" alt="Showcase of app functionality" height="500" />
  <figcaption>Please excuse the compression!</figcaption>
</figure>

## Table Of Contents

<details>
  <summary>Expand Contents</summary>

- [About this project](#about-this-project)
  - [What it does](#what-it-does)
  - [How to use it](#how-to-use-it)
  - [Thought process](#thought-process)
  - [Features](#features)
  - [Code samples](#code-samples)
  - [Designs](#designs)
  - [Tools I used](#tools-i-used)
  - [Technical decisions](#technical-decisions)
  - [Architecture](#architecture)
  - [Authentication](#authentication)
- [Thoughts and considerations](#thoughts-considerations)
  - [On what I learned](#what-i-learned)
  - [On returning to an older project](#returning-to-older-project)
  - [On changes I would make in this project](#changes-i-would-make)
  - [On changes I made in the next project](#how-i-learned-from-mistakes)
  - [On challenges I faced](#challenges-i-faced)
  - [On strengths of the project](#strengths-of-project)
  - [On areas to improve](#areas-to-improve)
- [Final thoughts](#final-thoughts)

</details>

## About this project <a name="about-this-project"></a>

With this project I wanted to put into practice all I had learned during the [Odin Project](https://www.theodinproject.com/) curriculum. I aimed to create a more maintanable codebase with better separation of concerns, and to mix tools across the stack including React, Express, and MongoDB.

### What it does <a name="what-it-does"></a>

Users can send FakeMate™ requests, post humourous updates with emojis and images, write snarky comments, receive notifications whenever friends are active, and personalize their profile. On the roadmap is also a messenger feature where users can chat privately or in groups.

### How to use it <a name="how-to-use-it"></a>

**Note**: currently there is no production version. I sincerely apologize.

1. Register with Google account or email and password
2. Create new posts on the timeline, comment and like your friend's posts
3. Personalize your profile page and visit your friend's profiles
4. Send friend requests to anybody who, you hope, will accept

### Thought process <a name="thought-process"></a>

- No tutorials/run throughs, straight up perseverance and Google-fu.
- Methodical approach, no jumping into IDE with only a vague idea of what I wanted to build.
- Logical separation of concerns, hierarchical directory structures.
- Hardening code with tests, handling edge cases with conditionals, not a "this code works" attitude, rather a "this code works, _securely_" one.
- Should be responsive and work on both mobile and desktop.

- How I approached it:

  1. Created basic user stories along the lines of "As a user I want to be able to update my avatar so that everybody can see how gorgeous I am"
  2. Worked out which pages I would need (sitemap), accounting for all functionality defined in user stories
  3. Coffee break #1
  4. Created wireframes and then full mock-ups for each page in Figma
  5. Modelled data by looking for nouns in mock-ups, for example `Message`s and `Conversation`s, `Post`s and `Comment`s
  6. Worked out which REST endpoints I would need, and which HTTP verbs to use for each
  7. Coffee break #2, optional nap
  8. Implemented backend first, then client (perhaps not the best idea...)

### Features <a name="features"></a>

- Social login with Google
- Timeline with infinite scroll
- Posts and comments, "like" functionality for both
- Friend request system
- Customizable private/public profiles
- Notification system (currently updates on refresh - Websocket implementation on roadmap)
- User search (backend implementation only)
- Messenger (backend implementation only)

### Code samples <a name="code-samples"></a>

- [Custom CSS with BEM](/client/src/pages/Profile/FriendsListModal/FriendsListModal.css)
- [CSS reset and tokens](/client/src/App.css)
- [Comprehensive API tests](/server/tests/integration/comment.test.js)
- [Custom middleware](/server/src/middlewares/validate.js)
- [Sanitization/validation with Joi](/server/src/validations/post.validation.js)
- [Mongoose model with hooks](/server/src/models/conversation.model.js)
- [Business logic checking for edge cases](/server/src/controllers/friend-request.controller.js)
- [Separating routing and business logic](/server/src/routes/post.route.js)
- [Use of clear comments](/server/src/controllers/comment.controller.js)
- [Custom React hook](/client/src/hooks/useFetch.jsx)
- [Custom carousel implementation](/client/src/components/AdsCarousel/AdsCarousel.jsx)
- [Custom webpack config](/client/webpack.config.js)

### Designs <a name="designs"></a>

I designed my app using Figma. I enjoyed learning about design fundamentals (typography, colour theory, etc) and working in a different environment, though without experience it took a while to come up with workable and aesthetic examples. I am very happy with how they turned out and learned a lot about the work of a designer which is perhaps the biggest lesson when considering a collaborative workplace. They also helped me focus on implementation during the development process as I was able to reference them throughout. The following are samples of wireframes (for profile page) and full mockups (for timeline):

<p align="center">
  <img src="profile-wireframe.png" alt="Wireframe of profile page" height="300" />
</p>

<p align="center">
  <img src="feed-mockup.png" alt="Mockup of feed page" height="250" />
</p>

### Tools I used <a name="tools-i-used"></a>

- React ecosystem (React Router, Formik, Yup, date-fns)
- Webpack bundler
- Node.js with Express framework
- Mongoose ODM
- Joi
- Multer
- Morgan logger
- Passport.js for traditional/Google registration
- JWT tokens
- Supertest, Jest, and mongodb-memory-server for API testing
- Figma

### Technical decisions <a name="technical-decisions"></a>

- All resources in REST API have no nested path segments beyond the pattern resource/id, and are instead made specific via parameters such as `/friend-requests?to=<userid>`, `/conversations?type=group`, and `/users/<userid>?action=change-visibility`. This is more extensible, for example if I wanted a widget showing latest `Comment` on landing page, outside context of its related `Post`.
- JWT access token stored in an HTTP only cookie to prevent XSS, and has a max age of 15 minutes. This is a simpler way for client to send credentials to the backend, preventing the need for LocalStorage.
- CSS written with BEM methodology to organize previously unwieldy CSS (and I _do_ mean unwieldy).
- Skeleton loaders instead of spinner - improved UX.
- Created custom implementations to learn the fundamentals instead of reaching for libraries immediately, for example:
  - Infinite scroll (timeline) which uses native browser IntersectionObserver API, callback refs, etc
  - Carousel with autoplay (ads)
  - Sliding drawer with animated backdrop (notifications/menu)

### Architecture (dev only) <a name="architecture"></a>

- Client: React, Webpack dev server, proxied API requests to server
- Server: Nodemon, Express, Mongoose
- Database: MongoDB daemon running locally, visualized in MongoDB Compass GUI
- Network: Switched between localhost and private IP to test usability on multiple devices on network

### Authentication <a name="authentication"></a>

I learned a lot about how to secure an app in both the client and the backend. For example, how the client is inherently unsecure because the code is bundled and sent to the browser in its entirety so any bundled environment variables can be seen, state can be manipulated with devtools, and form validation can be sidestepped. This is why I spent a lot of time securing the backend. I allow traditional email/password registration as well as with a Google account. The flow for the latter is as follows:

1. User clicks Google button (react-oauth library with 'implicit grant' flow so client receives ID token immediately after user consents. Abstraction over Google Identity Services)
2. Consent screen pops up, user agrees to sharing account details of limited scope
3. Google returns ID token (JWT) from their OAuth servers
4. Client makes request to backend, sends token
5. Passport.js strategy verifies token claims (is `aud` equal to app's Google Client ID? Is the `iss` set to Google? Is the `exp` date still valid?). Google recommends using a third-party library to handle these checks, so I used Passport.js because I was also using their basic strategy for traditional registrations with email/password
6. Find or create account with details sourced from verified token (mongoose-findorcreate library)
7. New JWT created locally, returned in a session cookie along with HTTP response
8. Cookie sent in every request to authenticate user (credentials and CORS are configured)

## Thoughts and considerations <a name="thoughts-considerations"></a>

### On what I learned <a name="what-i-learned"></a>

- When code turns into spaghetti, it's time to rethink the approach; aim for rigatoni or penne, the most logical of the pastas.
- Better to do a smaller project from A-Z with a final usable product, than an unfinished masterpiece.
- Importance of maintainable and focused React components to make client code more reusable and refactor(-able?), and easier to test.
- Websockets/Socket.io (for messenger) and Server Sent Events (for notifications).
- Data aggregation pipelines for complex data retrieval.
- How to model data; entity relationships with cardinality.
- Design fundamentals like typography, color theory, wireframes and mock-ups, as well as working in Figma.
- How there are usually many solutions and choosing the "wrong" one can build up technical debt.
- How React works, custom and built-in hooks like useMemo and useCallback, forwardRef.
- OAuth and JWT, stateless authentication mechanisms.
- Importance of protecting API because it can be reached via tools other than a browser such as cURL or Postman which can bypass CORS.
- Best to use an Agile approach of continuous improvement based on user feedback rather than trying to finish everything before initial deployment.

### On returning to an older project <a name="returning-to-older-project"></a>

- Lots of clarifying comments helped me get back up to speed quickly.
- Some dependencies can become unmaintained and a security vulnerability, and a fresh npm install can cause obscure issues relating to different versions of libraries no longer playing nicely together (I checked for latest updates on npm registry for all the deps to assess risk).
- Notes I helpfully retained on a (surprisingly solid) plywood shelf regarding the architecture helped me understand how to run the app, including how I had used systemctl with mongod in the terminal to start up the local database.
- Highlighted how much I have progressed as a developer (primitive use of Git, limited code quality tooling, no state management library, it goes on and on...).
- It also highlighted how much I grew as a developer during the project as React components created later in the project have a noticeably different approach; smaller and with conditional JSX stored in a variable outside the return statement. It was much easier to reason about these than the components written earlier.
- Importance of a .env.example file because it took a while to figure out why my app was broken after cloning...

### On changes I would make in this project <a name="changes-i-would-make"></a>

- Refactor a lot of the JSX - too large, too many conditionals, hard to reason about - extract outside of return statement.
- Extract some local state to Context (Redux might be overkill - most of the state is from the server which could be handled with a data fetching library which caches queried data).
- Branching strategy with pull requests and a CI flow, not pushing directly to main branch like a devil-worshipping madman.
- Store images in a cloud storage service like S3 because user uploaded images quickly fill up server's upload directory.
- Add errors inside a toast rather than directly inside the JSX - less bugs caused by the component re-rendering. I had to write code to work around this like flags stored in local state and it caused a build up of technical debt which became hard to reason about (**translation:** confused the bejeezus out of me when I came back to the project many months later)
- Add useCallback to all the custom data fetching functions defined inside components such as "likeComment" - prevents rebuilding function on every render.

### On changes I made in the [next major project](https://github.com/Thomas-J-A/diet-accountability-app/tree/main) (or, how I learned from my mistakes) <a name="how-i-learned-from-mistakes"></a>

- State management and data fetching with Apollo Client
- React components mostly under 200 SLOC
- React component testing with testing library
- Radix UI for better accessibility (keyboard navigation, WCAG/ARIA attributes)
- react-toastify used for notifications/errors
- S3 for user uploads
- Reduced number of features
- Frequent user feedback during development
- Development environment spun up with a Docker Compose file so i'll never forget how to run the app!

### On challenges I faced (and valiantly overcame) <a name="challenges-i-faced"></a>

- Creeping scope - lots of research into notification system, instant messenger, profiles, posts with comments. Overcame with help of Stack Overflow, Google, coffee, and being gifted with the perseverance of a dogged delivery man.
- Considering - and handling - all permutations. For example, when someone likes a comment on a post, was that comment written by a friend? a stranger? a stranger, but with a public account? yourself? Wrote down possibilities on paper, but AI might have helped here.
- Needed to retrieve heavily massaged `Conversation` documents from database - used a data aggregation pipeline with Mongoose.
- In the messenger feature, if A in a private chat deletes that chat while B does not, and then B sends another message, the same `Message` document in the database is used. Leant about the idea of soft deletion.

### On strengths of the project <a name="strengths-of-project"></a>

- Comprehensive API tests (around 6000 SLOC! I _really_ like tests)
- Tests cover happy path, errors, possible invalid inputs, authentication.
- Strong separation of concerns in API (routes, validations, controllers, models, etc).
- Comprehensive sanitization and validation in backend to prevent misuse.
- Logs each request (path, method, status code, response time, etc).
- Custom CSS, CSS reset, various tokens for fonts, spacings, etc.
- Secure auth system with JWT, session cookies, CORS, OAuth 2.0.
- Centralized error handling in API.
- Denormalization in database models like `commentsCount` field in
  `Post` model - avoids additional queries.

### On areas to improve <a name="areas-to-improve"></a>

**Translation**: bits of code I wish I had never written and am embarrassed by, or bits of code that never were.

- Certain React components that are difficult to test - i'm looking at you, [Profile.jsx](/client/src/pages/Profile/Profile.jsx). Refactor into smaller units.
- Accessibility - no outlines for keyboard users, no ARIA attributes, probably gobbledygook for a screenreader.
- Lack of deployed version. This one hurts the most considering the effort that went into it.

## Final thoughts <a name="final-thoughts"></a>

With this project I combined client, server, and database into a fully functioning full-stack application. I learnt about how all parts of the stack interact with each other and the general architecture involved in things such as authentication, database interaction, API requests, testing etc. I attempted to follow best practices such as separating business and routing logic in the backend, and organizing my React code into various directories. I felt like I achieved this best in the backend. In future projects I will endeavour to further modularize the client code into smaller components that can be tested and reused. The scope of the project was perhaps too large and requires specialized tools to handle the added complexity in order to avoid code sprawl and technical debt (a data fetching library, for example). On the other hand, implementing custom features and CSS undoubtedly sharpened my coding skills and knowledge. Overall, I have gained a solid foundation in the architecture involved in a full stack application upon which to build future apps which can afford a greater focus on code quality.

<p align="center">
  <img alt="Man dropping a mic with attitude" src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2RicjFwMW40M3U2aDVqamxrMXVjOGZoOHE2dDdyYndza203cmUydCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5UKlxhmcxiEoN2gHCq/giphy.gif" />
</p>
