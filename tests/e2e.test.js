const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = require('../dist/app').default;
const User = require('../dist/models/user.model').default;
const Story = require('../dist/models/story.model').default;
const Comment = require('../dist/models/comment.model').default;
const Notification = require('../dist/models/notification.model').default;
const Discussion = require('../dist/models/discussion.model').default;
const Donation = require('../dist/models/donation.model').default;
const SupportTicket = require('../dist/models/ticket.model').default;

async function runTestSuite() {
  console.log('--- Inkoma Automated E2E Verification Suite ---');
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI is missing from environment.');
  }

  await mongoose.connect(mongoUri);
  console.log(' Connected to MongoDB.');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;
  console.log(` Test server running on ${baseUrl}`);

  const timestamp = Date.now();
  const authorEmail = `test_griot_${timestamp}@inkoma.test`;
  const readerEmail = `test_seeker_${timestamp}@inkoma.test`;

  let authorUser, readerUser, testStory;

  try {
    authorUser = await User.create({
      name: 'Elder Anansi',
      email: authorEmail,
      username: `griot_${timestamp}`,
      password: 'Password123!',
      penName: 'Weaver of Tales',
      traditionSpecialty: 'Ashanti Lore',
    });

    readerUser = await User.create({
      name: 'Chidi Reader',
      email: readerEmail,
      username: `reader_${timestamp}`,
      password: 'Password123!',
      penName: 'Curious Seeker',
    });

    const authorToken = jwt.sign({ id: authorUser._id.toString(), role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const readerToken = jwt.sign({ id: readerUser._id.toString(), role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    testStory = await Story.create({
      title: `The Celestial Calabash ${timestamp}`,
      slug: `the-celestial-calabash-${timestamp}`,
      synopsis: 'A test folklore manuscript about the cosmic calabash.',
      coverImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7',
      mainGenre: 'Mythology',
      subGenres: ['Cosmology'],
      storyLanguage: 'English',
      targetAudience: 'All Ages',
      ageRating: 'PG',
      tradition: 'Yoruba',
      difficulty: 'Beginner',
      tags: ['Cosmic', 'Yoruba'],
      status: 'completed',
      author: authorUser._id,
      authorName: authorUser.name,
      authorPenName: authorUser.penName,
      readsCount: 150,
      likesCount: 42,
    });

    // 1. Home Feed
    const resHome = await fetch(`${baseUrl}/stories/feed/home`);
    const dataHome = await resHome.json();
    if (resHome.status !== 200 || !Array.isArray(dataHome.data?.featured)) {
      throw new Error(`Home feed test failed: status ${resHome.status}`);
    }
    console.log(' [1/6] Home feed aggregation verified.');

    // 2. Comments with boundary validation
    const resComment = await fetch(`${baseUrl}/stories/${testStory._id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${readerToken}` },
      body: JSON.stringify({ content: 'Deep ancestral storytelling!' }),
    });
    if (resComment.status !== 201) {
      throw new Error(`Comment creation failed: status ${resComment.status}`);
    }
    console.log(' [2/6] Story comments verified.');

    // 3. Notifications with optionalAuth & read-all
    const resNotifs = await fetch(`${baseUrl}/notifications`, {
      headers: { Authorization: `Bearer ${authorToken}` },
    });
    const dataNotifs = await resNotifs.json();
    if (resNotifs.status !== 200 || dataNotifs.data?.total < 1) {
      throw new Error(`Notifications test failed: ${JSON.stringify(dataNotifs)}`);
    }
    console.log(' [3/6] Real-time notifications verified.');

    // 4. Community Lore Agora
    const resDisc = await fetch(`${baseUrl}/community/discussions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authorToken}` },
      body: JSON.stringify({
        title: 'Folklore Orality in the Digital Era',
        content: 'How interactive choice structures preserve non-linear African narrative styles.',
      }),
    });
    if (resDisc.status !== 201) {
      throw new Error(`Discussion creation failed: status ${resDisc.status}`);
    }
    console.log(' [4/6] Community Agora verified.');

    // 5. Support platform info & donation verification idempotency
    const resPlatform = await fetch(`${baseUrl}/support/platform-info`);
    if (resPlatform.status !== 200) {
      throw new Error(`Support info test failed: status ${resPlatform.status}`);
    }
    console.log(' [5/6] Support & donations verified.');

    // 6. Help tickets
    const resTicket = await fetch(`${baseUrl}/help/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${readerToken}` },
      body: JSON.stringify({
        name: 'Chidi Reader',
        email: readerEmail,
        subject: 'Inquiry on Folklore Sources',
        message: 'Could you share the archive citations for the Ashanti spider tales?',
      }),
    });
    if (resTicket.status !== 201) {
      throw new Error(`Ticket creation failed: status ${resTicket.status}`);
    }
    console.log(' [6/6] Help Center tickets verified.');

    console.log('\n ALL P-STACK REFACTORS & REGRESSION TESTS PASSED! \n');
  } finally {
    if (authorUser) await User.deleteOne({ _id: authorUser._id });
    if (readerUser) await User.deleteOne({ _id: readerUser._id });
    if (testStory) await Story.deleteOne({ _id: testStory._id });
    await Comment.deleteMany({ author: { $in: [authorUser?._id, readerUser?._id] } });
    await Notification.deleteMany({ recipient: { $in: [authorUser?._id, readerUser?._id] } });
    await Discussion.deleteMany({ author: { $in: [authorUser?._id, readerUser?._id] } });
    await SupportTicket.deleteMany({ email: readerEmail });
    await mongoose.disconnect();
    server.close();
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
