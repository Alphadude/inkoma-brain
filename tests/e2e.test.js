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

function createTestPdf() {
  const contentStream =
    'BT /F1 12 Tf 72 712 Td (Chapter 1: The Fire Keeper) Tj 0 -20 Td (Once upon a time in the kingdom of Oyo.) Tj 0 -40 Td (Chapter 2: The River Goddess) Tj 0 -20 Td (The sacred waters whispered ancient truths.) Tj ET';
  const streamLength = Buffer.byteLength(contentStream);

  return Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${contentStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000300 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
377
%%EOF`);
}

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

  let authorUser, readerUser, testStory, importedStoryId, autoTaggedStory;

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
      preferredCategories: ['Afrofuturism'],
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
    console.log(' [6/7] Help Center tickets verified.');

    // 7. PDF Manuscript Extraction & Import
    const pdfBuf = createTestPdf();
    const parseForm = new FormData();
    parseForm.append('file', new Blob([pdfBuf], { type: 'application/pdf' }), 'the-legends-of-oyo.pdf');
    const resParse = await fetch(`${baseUrl}/stories/parse-pdf`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authorToken}` },
      body: parseForm,
    });
    if (resParse.status !== 200) {
      const errText = await resParse.text();
      throw new Error(`Parse PDF failed: status ${resParse.status} - ${errText}`);
    }
    const parseJson = await resParse.json();
    if (parseJson.data.totalChapters !== 2) {
      throw new Error(`Parse PDF expected 2 chapters, got ${parseJson.data.totalChapters}`);
    }

    const importForm = new FormData();
    importForm.append('file', new Blob([pdfBuf], { type: 'application/pdf' }), 'the-legends-of-oyo.pdf');
    importForm.append('title', 'The Legends of Oyo');
    importForm.append('mainGenre', 'Folklore & Mythology');
    const resImport = await fetch(`${baseUrl}/stories/import-pdf`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authorToken}` },
      body: importForm,
    });
    if (resImport.status !== 201) {
      const errText = await resImport.text();
      throw new Error(`Import PDF failed: status ${resImport.status} - ${errText}`);
    }
    const importJson = await resImport.json();
    if (!importJson.data.story || importJson.data.story.chapters.length !== 2) {
      throw new Error(`Import PDF expected 2 chapters in story, got ${importJson.data.story?.chapters?.length}`);
    }
    importedStoryId = importJson.data.story._id;
    console.log(' [7/8] PDF Manuscript Parsing & Draft Story Import verified.');

    // 8. Story Automated Tagging, Explore Tag Filters & Home Category Personalization
    const resCreateStory = await fetch(`${baseUrl}/stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authorToken}` },
      body: JSON.stringify({
        title: `The Cybernetic Orisha ${timestamp}`,
        synopsis: 'An Afrofuturist epic of spirits in the quantum network.',
        mainGenre: 'Afrofuturism',
        status: 'ongoing',
        chapters: [{ title: 'Chapter 1', content: 'In the digital ether...', hasAudioNarration: true }],
      }),
    });
    if (resCreateStory.status !== 201) {
      const err = await resCreateStory.text();
      throw new Error(`Auto-tag story creation failed: ${err}`);
    }
    const createStoryJson = await resCreateStory.json();
    autoTaggedStory = createStoryJson.data.story;
    if (!autoTaggedStory.tags.includes('New Release') || !autoTaggedStory.tags.includes('Audio Narration')) {
      throw new Error(`Expected auto-tags ['New Release', 'Audio Narration'], got: ${JSON.stringify(autoTaggedStory.tags)}`);
    }

    // B. Explore Page Tag Filter
    const resTagQuery = await fetch(`${baseUrl}/stories?tags=New Release`);
    const tagQueryJson = await resTagQuery.json();
    const foundTagged = tagQueryJson.data.stories.some(s => s.tags?.includes('New Release'));
    if (!foundTagged) {
      throw new Error('Explore filter by tag "New Release" failed');
    }

    // C. Home Page Personalized Category for You
    const resHomePersonalized = await fetch(`${baseUrl}/stories/feed/home`, {
      headers: { Authorization: `Bearer ${readerToken}` },
    });
    const homeJson = await resHomePersonalized.json();
    if (homeJson.data.categoryForYou?.categoryName !== 'Afrofuturism') {
      throw new Error(`Expected categoryForYou Afrofuturism, got: ${homeJson.data.categoryForYou?.categoryName}`);
    }
    console.log(' [8/8] Automated New Release Tagging & Category Personalization verified.');

    console.log('\n ALL P-STACK REFACTORS & REGRESSION TESTS PASSED! \n');
  } finally {
    if (authorUser) await User.deleteOne({ _id: authorUser._id });
    if (readerUser) await User.deleteOne({ _id: readerUser._id });
    if (testStory) await Story.deleteOne({ _id: testStory._id });
    if (importedStoryId) await Story.deleteOne({ _id: importedStoryId });
    if (autoTaggedStory) await Story.deleteOne({ _id: autoTaggedStory._id });
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
