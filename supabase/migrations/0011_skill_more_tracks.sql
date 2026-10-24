-- ─── 0011_skill_more_tracks.sql ─────────────────────────────────────────────
-- Adds 4 new published skill tracks (3 lessons each, 50 skill points per track)
-- so total published skill points = 300, comfortably clearing Level 3 (250 pts).
--
-- ALL statements are idempotent:
--   • skill_tracks  → ON CONFLICT (slug) DO NOTHING
--   • skill_lessons → ON CONFLICT (track_id, position) DO NOTHING
-- Tables and RLS policies already exist from 0007_zed_skill.sql; no DDL changes.
-- Do NOT run manually; apply via Supabase dashboard or CLI.

DO $$
DECLARE
  v_track3_id uuid;
  v_track4_id uuid;
  v_track5_id uuid;
  v_track6_id uuid;
BEGIN

  -- ── Track 3: Freelancing & Getting Paid Online ────────────────────────────

  INSERT INTO public.skill_tracks (slug, title, description, is_published)
  VALUES (
    'freelancing-and-getting-paid-online',
    'Freelancing & Getting Paid Online',
    'A practical guide to finding your first remote clients, writing a simple proposal, pricing your work honestly, and receiving payments safely across borders.',
    true
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_track3_id;

  IF v_track3_id IS NULL THEN
    SELECT id INTO v_track3_id FROM public.skill_tracks WHERE slug = 'freelancing-and-getting-paid-online';
  END IF;

  INSERT INTO public.skill_lessons (track_id, title, summary, content_md, position, skill_points)
  VALUES
    (
      v_track3_id,
      'Finding Your First Freelance Clients',
      'Learn where to look for early clients, how to position yourself with no portfolio, and how to make a strong first impression online.',
      E'### Where Early Clients Come From\n\nMost first-time freelancers wait for clients to find them. The practical approach is the opposite: you go where clients already are and make it easy for them to trust you.\n\n#### Platforms Worth Starting On\n- **Upwork & Fiverr**: High competition, but good for building a verifiable track record through reviews.\n- **LinkedIn**: Especially effective for writing, design, virtual assistance, and tech roles. Keep your profile complete and your headline specific (e.g., "WordPress Developer | Lagos, Nigeria" rather than "Freelancer").\n- **Local WhatsApp groups and communities**: Small business owners often post requests for web designers, social media managers, and data entry support.\n- **Cold outreach**: A short, polite message to a small business that has a clearly broken website or inactive social media is a real strategy—keep it about how you can help them, not about you.\n\n#### Setting Up Before You Pitch\n1. **Create a portfolio page**: Even three sample projects (real or practice pieces) are enough to start. Google Sites and Notion are free.\n2. **Write a short professional bio**: Name, skill area, types of work you do, and how to contact you.\n3. **Get a professional email address**: Use your name, not a nickname.\n\n#### What Not to Do\n- Do not send the same generic message to 100 people. Personalised outreach converts better.\n- Do not lie about experience. Clients check. Being honest about being new but motivated is a stronger position than being caught in an exaggeration.\n\n---\n\n**Try this:** Pick one platform or community. Spend 30 minutes filling out your profile completely and identifying three potential clients or job posts you could respond to today.',
      1,
      15
    ),
    (
      v_track3_id,
      'Writing a Simple Proposal That Gets Read',
      'Structure a short, client-focused proposal that clearly states what you will deliver, when, and for how much.',
      E'### A Good Proposal Is Short and Clear\n\nMany beginners write long proposals full of background about themselves. Clients are busy—what they need to know quickly is: can this person solve my problem?\n\n#### The 4-Part Proposal Structure\n\n1. **The Hook (1–2 sentences)**\n   Show you read the brief. Briefly name the problem you are solving.\n   > *"I noticed you need help organising your product photos and updating your Shopify listings before the holiday season."*\n\n2. **What You Will Deliver**\n   A clear, specific list. Avoid vague language like "I will help with your social media." Be specific:\n   - 12 Instagram posts per month (images + captions)\n   - A content calendar shared on Google Drive\n   - One revision round per post\n\n3. **Timeline**\n   State when you will start and when the client can expect the first deliverable.\n\n4. **Price and Payment Terms**\n   State your rate clearly. For new freelancers, a 50% upfront / 50% on delivery split is common and reasonable. Do not offer to work for free in the hope of getting more work—it sets a bad precedent.\n\n#### Common Mistakes\n- Spelling and grammar errors signal carelessness.\n- Forgetting to answer the question "why you?" — at least one sentence on relevant skill or experience.\n- Quoting a price without knowing the full scope; ask a clarifying question first if needed.\n\n---\n\n**Try this:** Take a job post you found in the last exercise and write a 150-word proposal using the 4-part structure above. Read it back out loud to check for clarity.',
      2,
      15
    ),
    (
      v_track3_id,
      'Getting Paid Safely Across Borders',
      'Understand common payment methods for Nigerian freelancers, how to receive money from international clients, and how to protect yourself from non-payment.',
      E'### Payment Options for Nigerian Freelancers\n\nReceiving money from clients outside Nigeria requires a payment channel that works reliably in both directions. Below is a general overview; always verify current availability and fees directly with the service provider before committing.\n\n#### Common Methods\n- **Payoneer**: Widely used by freelancers on platforms like Upwork and Fiverr. You receive a virtual US/EU bank account and can withdraw to a local Nigerian bank account. Verify the fee schedule on the Payoneer website.\n- **Wise (formerly TransferWise)**: Useful for receiving bank transfers in USD, GBP, or EUR. Check whether your account type is available in Nigeria at the time you sign up.\n- **Platform-built wallets**: Upwork and Fiverr have their own withdrawal flows that route to local bank accounts via local payment partners. These are often the simplest starting point.\n- **Direct local bank transfer**: For Nigerian clients paying in Naira, a simple bank transfer works fine.\n\n#### Protecting Yourself from Non-Payment\n- For new clients, always request a partial payment upfront before starting work.\n- Agree on deliverables and milestones in writing (even a WhatsApp message counts as a record).\n- Use the dispute resolution system on any platform that offers one before escalating.\n- Do not send final files or access credentials until the agreed payment has cleared.\n\n#### Red Flags\n- Clients who insist on payment methods that cannot be reversed or traced.\n- Overpayment scams: a "client" sends more than the agreed amount and asks you to return the difference—this is fraud.\n\n---\n\n**Try this:** Visit the Payoneer or Wise website and confirm whether the service is currently available for new sign-ups in Nigeria. Note the withdrawal fee for your preferred method.',
      3,
      20
    )
  ON CONFLICT (track_id, position) DO NOTHING;


  -- ── Track 4: Money Basics for Young Nigerians ─────────────────────────────

  INSERT INTO public.skill_tracks (slug, title, description, is_published)
  VALUES (
    'money-basics-for-young-nigerians',
    'Money Basics for Young Nigerians',
    'Practical financial foundations: budgeting, saving habits, and how to recognise and avoid loan and investment scams targeting young people.',
    true
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_track4_id;

  IF v_track4_id IS NULL THEN
    SELECT id INTO v_track4_id FROM public.skill_tracks WHERE slug = 'money-basics-for-young-nigerians';
  END IF;

  INSERT INTO public.skill_lessons (track_id, title, summary, content_md, position, skill_points)
  VALUES
    (
      v_track4_id,
      'Building a Simple Budget That Actually Works',
      'Create a realistic monthly budget using a percentage-based framework, track spending, and identify where money leaks out.',
      E'### Why Budgeting Matters Before Income Grows\n\nA budget is not about restriction—it is about making deliberate choices with whatever money you have. People who budget tend to save more, carry less stress about money, and make faster progress toward their goals.\n\n#### A Simple Starting Framework\n\nDivide your income (or allowance) roughly into three buckets:\n\n| Bucket | What it covers | Approximate share |\n|--------|---------------|-------------------|\n| **Needs** | Rent, transport, food, airtime | Around 50–60% |\n| **Wants** | Entertainment, eating out, subscriptions | Around 20–30% |\n| **Savings / Goals** | Emergency fund, target savings | At least 10–20% |\n\nThese percentages are a starting point, not a strict rule. Adjust based on your real situation.\n\n#### Practical Steps\n1. **List your monthly income** (salary, allowance, gig earnings, support from family).\n2. **List fixed expenses** that do not change month to month (rent, data subscription, transport pass).\n3. **Estimate variable expenses** (food, airtime top-ups, entertainment). Use your bank statement or mobile money history if you have it.\n4. **Compare totals**. If spending exceeds income, identify which "Wants" to reduce first.\n5. **Review weekly**. A quick 5-minute check keeps you on track.\n\n#### Free Tools\nA basic spreadsheet (Google Sheets is free) is sufficient. Budget apps exist, but a single sheet you actually open is more useful than a polished app you ignore.\n\n---\n\n**Try this:** Write down your three biggest spending categories from last month. Are they in the Needs, Wants, or Savings bucket? Is the split roughly what you want it to be?',
      1,
      15
    ),
    (
      v_track4_id,
      'Building Saving Habits on a Small Income',
      'Understand why saving a small amount consistently beats saving large amounts occasionally, and learn practical techniques to make saving automatic.',
      E'### The Power of Consistency Over Size\n\nA common belief is: "I will start saving when I earn more." This often results in never starting. The habit of saving matters more than the amount, especially early on.\n\n#### Core Principles\n\n1. **Pay yourself first**: When income arrives, move your savings amount immediately—before spending on anything else. Even a small fixed amount works.\n2. **Use a separate account**: Keeping savings in your main spending account makes them invisible and easy to dip into. A separate savings account (many banks offer these free) creates a useful psychological barrier.\n3. **Automate where possible**: If your bank allows standing instructions to a savings account, set one up on payday. Removing the decision removes the temptation.\n4. **Have a named goal**: "Emergency fund" or "Laptop by March" is more motivating than "savings." Attach your savings to a specific purpose.\n\n#### The Emergency Fund First\nBefore saving for goals, build a small emergency buffer—enough to cover an unexpected expense (a medical bill, a device repair, transport during a gap in income). Even a small buffer prevents one bad month from derailing your finances.\n\n#### What "Saving" Is Not\n- It is not keeping cash at home (prone to being spent or lost).\n- It is not money sitting in your primary current account mixed with spending money.\n- It is not investing in something you do not understand with money you cannot afford to lose.\n\n---\n\n**Try this:** Open a separate savings account at your bank this week (most have no minimum balance requirement for basic savings accounts). Transfer even a symbolic amount to start the habit.',
      2,
      15
    ),
    (
      v_track4_id,
      'Recognising and Avoiding Financial Scams',
      'Learn the patterns common to loan scams and fake investment platforms, and know the basic checks to run before trusting any financial service.',
      E'### Why Scams Target Young People Specifically\n\nFinancial scams are designed to exploit urgency, hope, and a lack of experience with how legitimate financial services operate. Young people, especially those looking to grow income quickly, are frequently targeted.\n\n#### Red Flags Common to Investment Scams\n- **Guaranteed returns**: No legitimate investment can guarantee a fixed high return. Markets carry risk. Anyone promising guaranteed profits is either lying or running a scheme that depends on new entrants to pay earlier ones.\n- **Urgency pressure**: "This offer closes today." "Only 10 spots left." Legitimate platforms do not pressure you to decide immediately.\n- **Payments to personal accounts**: Real regulated investment platforms do not ask you to send money to a personal bank account or mobile wallet.\n- **No verifiable registration**: A real Nigerian financial services provider can be looked up on the SEC Nigeria or CBN website. If a platform has no verifiable registration, that is a serious warning sign.\n\n#### Red Flags Common to Loan Scams\n- Upfront fees before receiving a loan. Legitimate lenders may charge fees, but they are typically deducted from the loan, not paid upfront.\n- No physical address or verifiable contact information.\n- Pressure to share your BVN or account credentials beyond what is standard.\n\n#### Basic Checks Before Trusting a Platform\n1. Search the platform name plus "scam" or "review" online.\n2. Check the SEC Nigeria website (sec.gov.ng) to confirm registration for investment platforms.\n3. Ask someone you trust who has used the platform independently.\n4. Never invest money you cannot afford to lose entirely.\n\n---\n\n**Try this:** The next time you see an investment opportunity on social media, run through the four checks above before engaging with it.',
      3,
      20
    )
  ON CONFLICT (track_id, position) DO NOTHING;


  -- ── Track 5: Communication & Interview Skills ─────────────────────────────

  INSERT INTO public.skill_tracks (slug, title, description, is_published)
  VALUES (
    'communication-and-interview-skills',
    'Communication & Interview Skills',
    'Master professional WhatsApp and email etiquette, prepare structured interview answers, and learn how to follow up after an interview.',
    true
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_track5_id;

  IF v_track5_id IS NULL THEN
    SELECT id INTO v_track5_id FROM public.skill_tracks WHERE slug = 'communication-and-interview-skills';
  END IF;

  INSERT INTO public.skill_lessons (track_id, title, summary, content_md, position, skill_points)
  VALUES
    (
      v_track5_id,
      'Professional WhatsApp & Email Etiquette',
      'Learn the unwritten rules of professional messaging—how to open, close, and structure messages so they are taken seriously.',
      E'### Why Tone and Format Matter in Professional Messaging\n\nIn many Nigerian workplaces and with most clients, WhatsApp is a primary communication channel. How you write on these platforms shapes how others perceive your professionalism—even before they have met you in person.\n\n#### WhatsApp Etiquette for Professional Contexts\n- **Greet before asking**: Starting with "Good morning" before a request is a basic professional courtesy. Jumping straight into a demand reads as abrupt.\n- **Send full messages, not fragments**: Avoid sending "Hello," then waiting for a reply before writing your actual message. Write the complete message at once.\n- **Use complete sentences**: Abbreviations like "hw r u" or "pls b4 eod" are fine with friends, not in professional communication.\n- **Respect hours**: Unless it is genuinely urgent, avoid sending work messages late at night or very early in the morning.\n- **Confirm receipt on action requests**: If someone asks you to complete a task over WhatsApp, acknowledge it clearly so they know you saw it.\n\n#### Email Etiquette Essentials\n- **Subject line**: Specific and informative. "Quick question" is not a good subject line. "Request: Invoice for October Services" is.\n- **Salutation**: "Good morning, [Name]," or "Dear [Name]," — avoid "Hey" in formal contexts.\n- **Body**: State your purpose in the first sentence. Use short paragraphs. Number action items.\n- **Sign-off**: "Kind regards," or "Best regards," followed by your full name.\n- **Proofread**: Read once before sending. Autocorrect errors in a professional email undermine your credibility.\n\n---\n\n**Try this:** Draft a professional WhatsApp message asking a potential employer or client for a callback, using the guidelines above. Read it back and check: does it sound like someone they would want to work with?',
      1,
      15
    ),
    (
      v_track5_id,
      'Answering "Tell Me About Yourself" and Other Key Questions',
      'Build a confident, structured answer to the most common interview question and learn how to handle behavioural questions using a simple framework.',
      E'### The Most Important 90 Seconds in Any Interview\n\n"Tell me about yourself" is almost always the first question. Most people answer it by reciting their CV in chronological order, which wastes the opportunity. A great answer is structured, concise, and forward-looking.\n\n#### A Simple Structure for "Tell Me About Yourself"\n\n1. **Present** (who you are now): Your current status, focus area, or most recent relevant experience.\n2. **Past** (what got you here): One or two specific experiences, qualifications, or projects that are directly relevant to this role.\n3. **Future** (why you are here): Why this specific role and organisation is the natural next step for you.\n\nKeep the total answer under 90 seconds. Practice it out loud—reading silently feels different from speaking.\n\n#### Handling Behavioural Questions\n\nQuestions like "Tell me about a time you dealt with a difficult colleague" are behavioural. Use the **STAR method**:\n- **S**ituation: Briefly describe the context.\n- **T**ask: What was your responsibility?\n- **A**ction: What did you specifically do?\n- **R**esult: What happened as a result?\n\nKeep each STAR answer under two minutes. Have 3–4 prepared stories that you can adapt to different questions.\n\n#### Questions to Prepare For\n- "What is your greatest weakness?" — Pick a real but manageable weakness and describe what you are doing about it.\n- "Why do you want to work here?" — Research the organisation first. Vague answers ("because it is a great company") are not convincing.\n- "Where do you see yourself in five years?" — Show ambition that aligns with the role.\n\n---\n\n**Try this:** Write out your "Tell me about yourself" answer using the Present–Past–Future structure. Time it with a stopwatch. Aim for 60–90 seconds.',
      2,
      15
    ),
    (
      v_track5_id,
      'Following Up After an Interview',
      'Know when and how to send a follow-up message after an interview, and how to respond professionally if you do not get the role.',
      E'### Why Following Up Matters\n\nA follow-up message after an interview is not just a courtesy—it is a second opportunity to reinforce your interest and leave a positive impression. Many candidates skip this step entirely, which means doing it correctly sets you apart.\n\n#### When to Follow Up\n\n- **Same day or next business day**: Send a short thank-you message or email. This is the most important follow-up and should happen regardless of how the interview went.\n- **After the stated decision date passes**: If the interviewer said "we will be in touch by Friday" and Friday passes with no word, it is appropriate to send a polite follow-up asking for an update.\n- **Do not follow up more than twice**: More than two follow-ups without a response reads as pressure.\n\n#### What to Include in a Thank-You Message\n\n- Thank the interviewer by name for their time.\n- Reference one specific thing discussed in the interview (this shows you were paying attention).\n- Restate your interest in the role in one sentence.\n- Keep the message short—five to eight sentences is ideal.\n\n#### Handling Rejection Professionally\n\nIf you receive a rejection:\n- Reply with a short, gracious acknowledgement.\n- Ask (politely, in the same message) if there is any feedback they are willing to share.\n- Move on. Rejection is part of every job search and does not reflect permanent failure.\n\nBuilding a professional relationship even after a rejection can lead to a referral, a future opening, or simply a positive reputation in your industry.\n\n---\n\n**Try this:** Write a draft thank-you email for a recent interview (real or hypothetical). Use the three-part structure: thank them, reference a specific conversation point, and restate your interest.',
      3,
      20
    )
  ON CONFLICT (track_id, position) DO NOTHING;


  -- ── Track 6: AI Tools for Everyday Work ──────────────────────────────────

  INSERT INTO public.skill_tracks (slug, title, description, is_published)
  VALUES (
    'ai-tools-for-everyday-work',
    'AI Tools for Everyday Work',
    'Use AI assistants safely for research, writing, and learning. Understand how to verify AI answers and what private information should never be shared with AI tools.',
    true
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_track6_id;

  IF v_track6_id IS NULL THEN
    SELECT id INTO v_track6_id FROM public.skill_tracks WHERE slug = 'ai-tools-for-everyday-work';
  END IF;

  INSERT INTO public.skill_lessons (track_id, title, summary, content_md, position, skill_points)
  VALUES
    (
      v_track6_id,
      'Using AI Assistants for Research and Learning',
      'Understand what AI assistants are good at, where they fail, and how to use them to accelerate research and self-study without being misled.',
      E'### What AI Assistants Actually Are\n\nAI assistants (such as ChatGPT, Gemini, Copilot, and others) are language models. They predict the most likely useful response based on patterns in large amounts of text. They are not search engines and do not look up real-time information by default. Understanding this distinction helps you use them well.\n\n#### What AI Is Genuinely Useful For\n- **Explaining concepts**: "Explain how a profit and loss statement works as if I am new to accounting" is an excellent use of an AI assistant.\n- **Summarising long documents**: Paste in a long article or report and ask for a summary of the key points.\n- **Brainstorming**: Generating a list of ideas, angles for an essay, or approaches to a problem.\n- **Drafting first versions**: AI can produce a rough draft of an email, report, or social media post that you then edit and improve.\n- **Learning new skills**: Asking follow-up questions in a conversation (like a patient tutor) is one of AI''s strongest use cases.\n\n#### What AI Is Poor At\n- **Exact facts, numbers, and dates**: AI sometimes produces confident-sounding incorrect information. This is called a "hallucination."\n- **Recent events**: Most models have a training cutoff and may not know about things that happened recently.\n- **Legal or medical specifics in your country**: AI may give general information that does not apply to Nigerian law or the Nigerian healthcare context.\n\n#### A Practical Research Habit\nUse AI to understand a topic, then verify key facts using official sources (government websites, established news outlets, published reports).\n\n---\n\n**Try this:** Ask an AI assistant to explain one concept you find confusing in your field of study or work. Then ask it three follow-up questions to go deeper. Notice how the conversation builds your understanding.',
      1,
      15
    ),
    (
      v_track6_id,
      'Checking AI Answers: When to Trust and When to Verify',
      'Develop a habit of verifying AI-generated information, recognise the signs of a plausible-sounding but incorrect answer, and know which types of claims always need a second source.',
      E'### AI Can Be Wrong With Confidence\n\nOne of the most important things to understand about AI assistants is that they can produce incorrect information in a tone that sounds completely authoritative. Unlike a website that might say "source unknown," an AI will often give you a confident answer that is simply wrong.\n\n#### The Verification Habit\n\nAlways verify before you rely. The level of verification needed depends on the stakes:\n\n| Stakes | Example | Verification needed |\n|--------|---------|---------------------|\n| Low | Getting a recipe idea | Minimal |\n| Medium | Research for an essay or report | Check the key claims against a reputable source |\n| High | Medical, legal, or financial decisions | Always consult a qualified professional |\n\n#### Types of Claims That Always Need Checking\n- **Statistics and numbers**: AI often generates plausible-sounding figures that are not accurate.\n- **Named people, companies, or events**: AI can invent quotes, titles, or events that never happened.\n- **Laws and regulations**: These vary by country and change over time. AI may describe rules that do not apply in Nigeria or are out of date.\n- **Product details and prices**: AI does not have real-time data.\n\n#### Simple Verification Steps\n1. Take the specific claim (e.g., a statistic or a law).\n2. Search for it on a credible source: a government website, an established news outlet, a published academic paper.\n3. If you cannot find it verified anywhere, treat it as unconfirmed.\n\n#### Citing AI in Academic or Professional Work\nMany employers and educational institutions have policies on using AI for submitted work. Always check the relevant policy before using AI-generated content in formal submissions.\n\n---\n\n**Try this:** Ask an AI assistant for three facts about a topic you know reasonably well. Look up each fact independently. Were they all accurate?',
      2,
      15
    ),
    (
      v_track6_id,
      'What Never to Paste Into an AI Tool',
      'Understand the privacy risks of sharing sensitive personal or organisational data with AI tools, and apply simple rules to protect yourself and others.',
      E'### AI Tools and Your Privacy\n\nWhen you type text into an AI assistant, that text is sent to servers operated by the company behind the tool. Depending on the platform and its settings, your inputs may be used to improve future models or reviewed by staff. Even with privacy-protective settings, it is a good habit to treat AI inputs as not fully private.\n\n#### Information You Should Never Paste Into a Public AI Tool\n\n- **Personal identity information**: NIN, BVN, passport number, date of birth, full home address.\n- **Financial credentials**: Bank account numbers, card details, PINs, online banking passwords.\n- **Other people''s personal data**: Do not paste a colleague''s, client''s, or customer''s personal information into an AI tool without their knowledge and consent.\n- **Confidential business information**: Unpublished contracts, proprietary pricing, internal strategy documents, or any information your employer has marked as confidential.\n- **Login credentials**: Never paste usernames, passwords, or API keys into a chat interface.\n\n#### Why This Matters\nA data breach at an AI provider, or a policy that allows human review of inputs, could expose whatever you typed. Beyond the risk to yourself, sharing other people''s data without consent may breach their privacy rights.\n\n#### Safer Alternatives\n- **Anonymise before pasting**: Replace real names, account numbers, and specific identifying details with placeholders (e.g., "[Client Name]", "[Amount]") before using AI to help you draft a document.\n- **Use enterprise/privacy-focused modes where available**: Some AI tools offer modes where your inputs are not used for training. Check the provider''s documentation.\n- **Ask yourself before pasting**: "Would I be comfortable if this text were made public?" If not, do not paste it.\n\n---\n\n**Try this:** Review a document you recently worked on. Identify any information in it that would be sensitive to paste into an AI tool. Practise replacing it with neutral placeholders.',
      3,
      20
    )
  ON CONFLICT (track_id, position) DO NOTHING;

END $$;
