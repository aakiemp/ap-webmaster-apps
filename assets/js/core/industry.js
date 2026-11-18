/**
 * "Make it yours": the visitor's business name and type. The type swaps the
 * sample data's wording (services, jobs, tickets, projects...) so the demo
 * reads like their kind of business. Kept in this browser only.
 *
 * Home services is the original sample data, so its pack is empty and every
 * seed falls back to its own defaults. Packs list replacements in the same
 * order as the defaults they replace.
 */
const KEY = 'apwa.biz';

export const TYPES = [
  { id: 'home', label: 'Home services', icon: 'home', sample: 'Summit Home Services', word: 'contractor' },
  { id: 'salon', label: 'Salon and spa', icon: 'star', sample: 'Willow Salon & Spa', word: 'salon' },
  { id: 'fitness', label: 'Fitness studio', icon: 'zap', sample: 'Peak Fitness Studio', word: 'gym' },
  { id: 'pro', label: 'Professional services', icon: 'briefcase', sample: 'Harbor Advisory Group', word: 'firm' },
  { id: 'other', label: 'Something else', icon: 'grid', sample: 'Main Street Company', word: 'company' },
];

const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
let cur = read();

export function type() { return TYPES.find((t) => t.id === cur.type) || TYPES[0]; }
/** True once the visitor has typed their own business name. */
export function custom() { return !!(cur.name && cur.name !== type().sample); }
export function name() { return (cur.name || '').trim() || type().sample; }
/** A made-up domain for sample addresses, e.g. "willow-salon-spa". */
export function slug() { return name().toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 3).join('-') || 'my-business'; }
export function chosen() { return !!cur.type; }
/** What a "Something else" business does, in the visitor's words. */
export function what() { return type().id === 'other' ? (cur.what || '') : ''; }
/** The industry label shown in the demo. */
export function label() { return what() || (type().id === 'other' ? 'Small business' : type().label); }

const clean = (v, max) => String(v || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);

export function set(nameIn, typeId, whatIn) {
  const t = TYPES.find((x) => x.id === typeId) || TYPES[0];
  const n = clean(nameIn, 40);
  cur = { type: t.id, name: n || t.sample, what: t.id === 'other' ? clean(whatIn, 40) : '' };
  try { localStorage.setItem(KEY, JSON.stringify(cur)); } catch (e) { /* private mode: lasts this visit */ }
}

/** The current type's replacement data (empty for home services). */
export function pack() { return PACKS[type().id] || {}; }
/** Scale a sample amount to fit the business type. */
export function money(v, step = 5) { const s = pack().scale || 1; return s === 1 ? v : Math.max(step, Math.round((v * s) / step) * step); }
/** The pack's value at index i, or the default. */
export function at(key, i, def) { const a = pack()[key]; return a && a[i] != null ? a[i] : def; }

/* ------------------------------------------------------------------ */

const PACKS = {
  other: {
    scale: 0.25,
    services: [['Free consultation', 30, 0], ['Standard service', 60, 95], ['Premium service', 90, 175], ['Follow-up visit', 60, 75], ['Monthly service', 60, 150]],
    seriesNote: 'Standing weekly visit at their office.',
    bookingNotes: ['Prefers mornings.', 'Please call on arrival.', 'Send a reminder the day before.', 'Ask about their usual order.'],
    notes: ['Asked about pricing. Sent the price list.', 'Prefers text over calls during the workday.', 'Wants everything done before the holidays.', 'Comparing us with two other companies.', 'First meeting went well. Needs a revised quote.', 'Budget approved by their board.', 'Interested in a monthly plan later.', 'Left voicemail. Will try again Thursday.'],
    deals: ['Premium package', 'Starter package', 'Monthly service plan', 'Custom project', 'HOA service contract', 'Standard service', 'Staff event package', 'Premium package', 'Annual plan', 'Service bundle, 3 visits', 'Large custom order', 'Office service contract', 'Standard package', 'Add-on service', 'Starter package', 'Annual contract, 48 units', 'Custom project', 'Corporate order, 40', 'Monthly plan', 'Large event package', 'Standard service', 'Client appreciation event', 'Annual plan', 'Anniversary package', 'Service bundle', 'Tenant service program'],
    estimates: ['Premium package', 'Standard service', 'Custom project', 'Service bundle, 3 visits', 'Group order', 'Starter package', 'Add-on service', 'Monthly plan', 'Annual plan', 'Large custom order', 'Standard package', 'Premium service', 'Corporate order', 'Holiday order', 'Event package', 'Monthly plan'],
    tickets: [['Need help before my visit today', 'My visit is at 2 PM and I need to change something. Can someone call me?'], ['Not happy with my last order', 'Hi, something was not right with my last order. Can someone take a look?'], null, null, ['Online account shows the wrong balance', 'My account shows $40 but I think it should be $65.', 'Probably a credit not applied yet. Checking the history.', 'Could you send your order number? I will check the history for you.'], ['Question about the monthly plan', 'Does the plan include a visit every month?', 'Yes, one visit a month plus 10% off extras.'], ['Something came loose after the visit', 'A small part came loose the day after.', 'Fixed it today at no charge. Sorry about that!'], null],
    saved: [['Booking a visit', 'Thanks for reaching out. I can get you in. Does tomorrow at 10 AM work?'], ['Product question', 'Good question! I can walk you through the options on your next visit.'], ['Running late', 'Sorry for the wait. We are running about 15 minutes behind today.']],
    articles: [null, ['What does the monthly plan include?', 'One visit a month, priority booking and 10% off extras. You can cancel any time.'], ['What if something goes wrong?', 'Reply to your confirmation or call us. We will make it right as fast as we can.', 'Help'], null, ['Do you guarantee your work?', 'Yes. If something is not right, tell us within 30 days and we will fix it at no charge.']],
    feedback: ['Priya was on time and explained everything.', 'Fast and super friendly.', 'Great work, just a short wait.', '', 'Good, but booking was confusing.', 'Best company we have used.', '', 'Careful, friendly and quick.'],
    projects: [
      { name: 'Custom project: Delgado Property Group', phases: ['Kickoff', 'Plan and options', 'Prep', 'Delivery', 'Final review'], ob: ['Signed agreement', 'Deposit received', 'Site or contact details', 'Preferred times'], ap: [['Option A: standard finish', 'Two photos attached. About 10 days once approved.'], ['Colors and branding', 'Soft white with a navy accent.']], files: ['Signed agreement.pdf', 'Plan v2.pdf', 'Samples.jpg', 'Mood board.jpg'], up: ['Colors approved. We ordered materials and booked the team.', 'Kickoff is done. The plan is in Files.'], req: ['Can the team start after 9 AM? We open at 8:30.'] },
      { name: 'Large custom order', phases: ['Quote', 'Design', 'Production', 'Quality check', 'Delivery'], ob: ['Signed agreement', 'Deposit received', 'Delivery address'], ap: [['Change: add gift wrapping', 'Adds $340 and half a day.']], files: ['Order form.pdf', 'Design proof.pdf', 'Progress photo.jpg'], up: ['Production is done. Quality check starts Monday.'] },
      { name: 'Monthly service plan setup', phases: ['Welcome call', 'Plan details', 'Schedule', 'First visit'], ob: ['Signed agreement', 'First payment received', 'Main contact', 'Preferred times'], files: ['Service agreement.pdf'], up: ['Thanks for choosing us. Please finish the checklist so we can schedule your first visit.'] },
      { name: 'Event package', phases: ['Plan', 'Prep', 'Event day', 'Follow-up'], ob: ['Signed agreement', 'Deposit received'], ap: [['Final plan for the day', '']], files: ['Event summary.pdf', 'Photos.jpg'], up: ['All done. Your summary is in Files. Thank you!'] },
    ],
    ads: ['Main service - Search', 'Near me - Search', 'Brand - Search', 'Holiday offer', 'Retargeting - site visitors', 'Summer promo'],
    keywords: [['near me', '/'], ['best in riverside', '/'], ['main service riverside', '/services/'], ['main service cost', '/pricing/'], ['local company reviews', '/reviews/'], ['book online riverside', '/book/']],
    pages: [['/', 'Home'], ['/services/', 'Services'], ['/about/', 'About'], ['/book/', 'Book online'], ['/pricing/', 'Pricing'], ['/reviews/', 'Reviews']],
    job: 250,
    duties: ['Open up and check voicemail', 'Prep for today’s customers', null, 'Quick safety walk-through', 'Count stock and log usage', null, 'Post today’s work to social media'],
    sops: [{ steps: ['Open tomorrow on the calendar', 'Text each customer their time', 'Call anyone who has not replied by 3 PM', 'Note special requests on the booking', 'Flag cancellations to the office'] }, { title: 'Prepping for the day', cat: 'Daily', steps: ['Check the day’s schedule', 'Set out what each job needs', 'Check devices are charged', 'Restock supplies', 'Tidy the front area'] }, { title: 'Safety walk-through', cat: 'Safety', steps: ['Walkways are clear', 'Lights and signs work', 'Nothing broken or leaking', 'First aid kit is stocked', 'Log any issue on the equipment page'] }, { title: 'Closing up', steps: ['Charge the tablets', 'Turn off equipment', 'Lock the stock room', 'Set the alarm', 'Lock the front door'] }, { title: 'Handling an unhappy customer', cat: 'Customers', steps: ['Listen and thank them for telling you', 'Offer a fix at no charge', 'Book the fix before they leave', 'Call the next day to check in'] }],
    equipment: [['Company van', 'Vehicle'], ['Main work station', 'Equipment'], ['Label printer', 'Device'], ['Card reader', 'Device'], ['Step ladder', 'Safety'], ['Front desk tablet', 'Device']],
    equipHint: 'Equipment and devices: who has them and when each is due for service.',
    inventory: [['Shipping boxes, medium', 'BOX-M', 'each', 1.2, 'Supply Co.'], ['Labels', 'LBL-500', 'roll', 14, 'Supply Co.'], ['Cleaning supplies', 'CLN-KIT', 'kit', 22, 'Clean Pro Supply'], ['Gift cards', 'GFT-50', 'each', 0.6, 'Print Shop'], ['Printer paper', 'PPR-CASE', 'case', 42, 'Supply Co.'], ['Bags, branded', 'BAG-100', 'box', 26, 'Print Shop'], ['Receipt rolls', 'RCP-50', 'box', 30, 'Supply Co.']],
    templates: {
      seasonal: { subject: 'Our holiday offer is here', preview: 'Book this month and save 15%.', heading: 'The holidays are coming, {first_name}', body: 'The holidays are around the corner. Book before December 15 and take 15% off. Spots fill fast in December.', cta: 'Book now' },
      newsletter: { subject: 'What’s new this month', preview: 'Three quick updates from our team.', heading: 'November news', body: 'We have new hours for the holidays, a few new services and a thank-you offer for our regulars. Want to know more? Reply to this email or book online.' },
    },
    offerName: 'Holiday offer',
    seqSubjects: ['Ready when you are: book a free consultation', 'A quick tip from our team'],
    docs: { vendor: 'Supply Co.', lines: ['Shipping boxes, case', 'Labels, box', 'Printer paper, case'], merchant: 'Corner Coffee', category: 'Supplies', service: 'Standard service', work1: 'Standard service, 2 hours', work2: 'Follow-up visit', vendor2: 'Print Shop', lines2: ['Gift cards, box', 'Branded bags, case'], old: ['Supply Co.', 'Corner Coffee', 'Print Shop', 'Clean Pro Supply', 'Supply Co.', 'City Water Dept.'] },
  },

  salon: {
    scale: 0.08,
    roles: { u2: 'Senior Stylist', u3: 'Stylist', u4: 'Front Desk' },
    services: [['New client consultation', 30, 0], ['Haircut and style', 60, 65], ['Color and gloss', 120, 145], ['Signature facial', 60, 95], ['Massage, 60 minutes', 60, 110]],
    seriesNote: 'Standing weekly blowout before Monday client meetings.',
    bookingNotes: ['Prefers a quiet appointment.', 'Likes tea on arrival.', 'Please text a reminder.', 'Ask about the usual shade.'],
    notes: ['Asked about the bridal package. Sent the price list.', 'Prefers text over calls during the workday.', 'Wants everything booked before the holidays.', 'Comparing us with two other salons.', 'Trial went well. Wants to tweak the package.', 'Budget approved by their HR team.', 'Interested in a membership after the first visit.', 'Left voicemail. Will try again Thursday.'],
    deals: ['Bridal party, 6 people', 'Color correction series', 'Office wellness day, monthly', 'Wedding hair and makeup', 'HOA spa night event', 'Facial package, 3 visits', 'Staff holiday party pampering', 'Prom group, 5 people', 'Massage membership, 12 months', 'Keratin treatment series', 'Bridal party, 8 people', 'Team chair massage day', 'Lash lift and brow package', 'Gift card bundle', 'Balayage and cut', 'Resident spa days, yearly', 'Hair extensions', 'Corporate gift cards, 40', 'Blowout membership', 'Destination wedding party', 'Spa day for two', 'Client appreciation event', 'Color membership', 'Anniversary spa package', 'Highlights and treatment', 'Tenant wellness day'],
    estimates: ['Bridal party package', 'Color correction', 'Wedding hair and makeup', 'Facial series, 6 visits', 'Prom group styling', 'Lash extensions, full set', 'Hair extensions', 'Keratin smoothing', 'Spa day for four', 'Massage membership', 'Balayage and cut', 'Brow and lash package', 'Corporate wellness day', 'Holiday party styling', 'Bachelorette spa day', 'Blowout membership'],
    tickets: [['Itchy scalp after my color', 'My scalp has felt itchy since my color yesterday. Is that normal?'], ['Color faded after one week', 'Hi, my gloss faded a lot after a week. Can someone take a look?'], null, null, ['Gift card balance looks wrong', 'My gift card shows $40 but I think it should be $65.', 'Probably used for a tip last time. Checking the history.', 'Could you send the gift card number? I will check the history for you.'], ['Question about the membership', 'Does the membership include a blowout every month?', 'Yes, one blowout a month plus 10% off products.'], ['Gel nail chipped the next day', 'One of my gel nails chipped the day after.', 'Fixed it today at no charge. Sorry about that!'], null],
    saved: [['Booking a visit', 'Thanks for reaching out. I can get you in with a stylist. Does tomorrow at 10 AM work?'], ['Product question', 'Good question! That product is safe for color-treated hair. I can set one aside for your next visit.'], ['Running late', 'Sorry for the wait. Your stylist is running about 15 minutes behind today.']],
    articles: [null, ['What does the membership include?', 'One blowout a month, 10% off products and priority booking. You can cancel any time.'], ['How do I keep my color fresh?', 'Wash with cool water, use a sulfate-free shampoo and book a gloss every 6 to 8 weeks.', 'Hair care'], null, ['What is your redo policy?', 'If you are not happy with a service, tell us within 7 days and we will fix it at no charge.']],
    feedback: ['Priya listened and nailed the cut.', 'Relaxing and friendly.', 'Great color, just a short wait.', '', 'Lovely, but booking online was confusing.', 'Best salon in town.', '', 'Clean, calm and so welcoming.'],
    projects: [
      { name: 'Bridal party: Delgado wedding', phases: ['Consultation', 'Trial run', 'Final look approved', 'Wedding day', 'Follow-up'], ob: ['Signed agreement', 'Deposit received', 'Wedding date and venue', 'Party member list'], ap: [['Hair: soft waves, half up', 'Two photos attached from the trial.'], ['Makeup: natural glam', 'Neutral eyes with a rose lip.']], files: ['Signed agreement.pdf', 'Timeline v2.pdf', 'Trial photos.jpg', 'Inspiration board.jpg'], up: ['Makeup look approved. We booked two artists for the morning of the wedding.', 'The trial is done. Photos are in Files.'], req: ['Can we start at 7 AM? Photos begin at 11.'] },
      { name: 'Corporate wellness day', phases: ['Plan the day', 'Book the team', 'Set up the room', 'Wellness day', 'Feedback'], ob: ['Signed agreement', 'Deposit received', 'Room booked'], ap: [['Change: add two chair massage slots', 'Adds $180 and one hour.']], files: ['Event agreement.pdf', 'Schedule.pdf', 'Room photos.jpg'], up: ['All 24 slots are booked. Setup starts at 8 AM.'] },
      { name: 'Spa membership setup', phases: ['Welcome call', 'Pick services', 'Schedule visits', 'First visit'], ob: ['Signed agreement', 'First payment received', 'Preferred stylist', 'Service preferences'], files: ['Membership agreement.pdf'], up: ['Welcome! Please finish the checklist so we can book your first visit.'] },
      { name: 'Color correction series', phases: ['Consultation', 'Session 1', 'Session 2', 'Final gloss'], ob: ['Signed agreement', 'Deposit received'], ap: [['Final shade: warm caramel', '']], files: ['Care guide.pdf', 'Before and after.jpg'], up: ['All done. Your care guide is in Files. Thank you!'] },
    ],
    ads: ['Hair salon near me - Search', 'Bridal hair - Search', 'Brand - Search', 'Holiday gift card offer', 'Retargeting - site visitors', 'Summer color promo'],
    keywords: [['hair salon near me', '/'], ['salon riverside', '/'], ['balayage riverside', '/services/color/'], ['bridal hair cost', '/bridal/'], ['massage near me', '/services/massage/'], ['facial riverside', '/services/facials/']],
    pages: [['/', 'Home'], ['/services/color/', 'Color'], ['/bridal/', 'Bridal'], ['/book/', 'Book a visit'], ['/membership/', 'Membership'], ['/reviews/', 'Reviews']],
    job: 95,
    duties: ['Open the salon and check voicemail', 'Set up stations for today’s clients', null, 'Sanitize tools and stations', 'Count retail stock and log usage', null, 'Post today’s work to social media'],
    sops: [{ steps: ['Open tomorrow on the calendar', 'Text each client their time', 'Call anyone who has not replied by 3 PM', 'Note service preferences on the booking', 'Flag cancellations to the front desk'] }, { title: 'Setting up a station', cat: 'Floor', steps: ['Check the day’s client list', 'Lay out clean capes and towels', 'Check tools are charged', 'Restock color bowls and brushes', 'Wipe the mirror and chair'] }, { title: 'Sanitizing tools', cat: 'Safety', steps: ['Remove hair and debris', 'Wash with soap and water', 'Soak in disinfectant for 10 minutes', 'Rinse and dry', 'Store in a closed drawer'] }, { title: 'Closing the salon', steps: ['Start the towel laundry', 'Turn off dryers and irons', 'Lock the retail cabinet', 'Set the alarm', 'Lock the front door'] }, { title: 'Handling an unhappy client', cat: 'Floor', steps: ['Listen and thank them for telling you', 'Offer a fix at no charge', 'Book the redo before they leave', 'Call the next day to check in'] }],
    equipment: [['Shampoo station 1', 'Furniture'], ['Hood dryer', 'Equipment'], ['UV sanitizer cabinet', 'Equipment'], ['Facial steamer', 'Equipment'], ['Massage table', 'Furniture'], ['Front desk tablet', 'Device']],
    equipHint: 'Stations, tools and devices: who has them and when each is due for service.',
    inventory: [['Color tubes, 7N', 'CLR-7N', 'each', 8.5, 'Beauty Supply Co.'], ['Developer 20 vol', 'DEV-20', 'bottle', 12, 'Beauty Supply Co.'], ['Shampoo, backbar', 'SHP-GAL', 'gallon', 34, 'Beauty Supply Co.'], ['Foils, pre-cut', 'FOL-500', 'box', 16, 'Beauty Supply Co.'], ['Gel base coat', 'GEL-BASE', 'each', 14, 'Nail Supply Co.'], ['Disposable capes', 'CAP-100', 'box', 22, 'Beauty Supply Co.'], ['Massage oil', 'OIL-32', 'bottle', 18, 'Spa Source']],
    templates: {
      seasonal: { subject: 'Holiday glam is booking up', preview: 'Book a holiday style this month and save 15%.', heading: 'Party season is coming, {first_name}', body: 'Holiday parties are around the corner. Book a style or color before December 15 and take 15% off. Spots fill fast in December.', cta: 'Book my holiday style' },
      newsletter: { subject: 'Your winter hair care checklist', preview: 'Three quick habits that keep color fresh.', heading: 'November hair care checklist', body: 'Switch to a richer conditioner, turn down the heat on your styling tools and book a gloss before the holidays. Want help picking products? Reply to this email or book online.' },
    },
    offerName: 'Holiday glam offer',
    seqSubjects: ['Ready when you are: book a consultation', 'A quick tip to keep your look fresh'],
    docs: { vendor: 'Beauty Supply Co.', lines: ['Color tubes, assorted', 'Developer, case', 'Foils, box'], merchant: 'Corner Coffee', category: 'Client refreshments', service: 'Balayage and cut', work1: 'Color correction, session 2', work2: 'Signature facial', vendor2: 'Spa Source', lines2: ['Massage oil, case', 'Facial masks, box'], old: ['Beauty Supply Co.', 'Corner Coffee', 'Nail Supply Co.', 'Spa Source', 'Beauty Supply Co.', 'City Water Dept.'] },
  },

  fitness: {
    scale: 0.08,
    roles: { u2: 'Head Coach', u3: 'Coach', u4: 'Front Desk' },
    services: [['Free intro session', 30, 0], ['Personal training', 60, 75], ['Small group class', 60, 25], ['Fitness assessment', 60, 60], ['Team class', 60, 150]],
    seriesNote: 'Weekly team class at their office.',
    bookingNotes: ['Prefers morning sessions.', 'First time with a coach.', 'Set up the kettlebells in room B.', 'Likes an upbeat playlist.'],
    notes: ['Asked about payment plans. Sent the options.', 'Prefers text over calls during the workday.', 'Wants to start before the new year.', 'Comparing us with two other gyms.', 'Trial session went well. Wants a lighter schedule.', 'Budget approved by their HR team.', 'Interested in nutrition coaching later.', 'Left voicemail. Will try again Thursday.'],
    deals: ['Personal training, 24 sessions', 'Family membership, yearly', 'Corporate wellness program', 'Small group training, 3 months', 'HOA fitness classes', 'Intro pack, 5 classes', 'Staff fitness challenge', 'Personal training, 12 sessions', 'Annual membership', 'Nutrition coaching, 3 months', 'Personal training, 36 sessions', 'Team yoga sessions', 'Class pack, 20 classes', 'Drop-in bundle', 'Couples training, 8 weeks', 'Resident fitness classes, yearly', 'Strength program, 6 months', 'Corporate memberships, 20', 'Monthly membership', 'Private group bootcamp', 'Intro pack, 3 classes', 'Employee wellness week', 'Annual membership', 'Personal training, 20 sessions', 'Pilates package', 'Tenant fitness program'],
    estimates: ['Personal training, 12 sessions', 'Annual membership', 'Corporate wellness program', 'Nutrition coaching', 'Small group training', 'Intro pack', 'Couples training', 'Strength program', 'Personal training, 24 sessions', 'Family membership', 'Class pack, 20 classes', 'Pilates package', 'Team bootcamp', 'Yoga workshop series', 'Bootcamp, 6 weeks', 'Monthly membership'],
    tickets: [['Can’t check in before class', 'The app will not let me check in and class starts in 20 minutes.'], ['Charged twice this month', 'Hi, I see two membership charges on my card this month. Can someone check?'], null, null, ['Class pack shows the wrong count', 'My class pack says 2 left but I think I have 5.', 'Probably a late-cancel charge. Checking the history.', 'Could you tell me which classes you went to this month? I will check the history for you.'], ['Question about freezing my membership', 'Can I pause my membership while I travel?', 'Yes, you can freeze it for up to 2 months a year.'], ['Locker 14 will not lock', 'The lock on locker 14 is broken.', 'Fixed it today. Thanks for telling us!'], null],
    saved: [['Booking a session', 'Thanks for reaching out. I can get you in with a coach. Does tomorrow at 7 AM work?'], ['Membership question', 'Good question! Your membership includes unlimited classes and an assessment every quarter.'], ['Running late', 'Sorry for the wait. Your coach is running about 10 minutes behind today.']],
    articles: [null, ['What does the membership include?', 'Unlimited classes, a fitness assessment every quarter and 10% off personal training. You can cancel any time.'], ['How do I check in for class?', 'Open the app, tap the class and tap Check in when you arrive. The front desk can also check you in.', 'App help'], null, ['Can I freeze my membership?', 'Yes, up to 2 months a year at no charge. Just ask at the front desk.']],
    feedback: ['Coach Marcus kept it fun and challenging.', 'Great energy, super friendly.', 'Great class, just a bit crowded.', '', 'Good workouts, but booking was confusing.', 'Best studio we have tried.', '', 'Clean, welcoming and motivating.'],
    projects: [
      { name: 'Corporate wellness program', phases: ['Kickoff call', 'Team assessments', 'Program plan', 'Weekly classes', 'Results review'], ob: ['Signed agreement', 'Deposit received', 'Team roster', 'Preferred class times'], ap: [['Class plan: strength and mobility mix', 'Two sample weeks attached.'], ['Class times: Tuesdays and Thursdays', 'Lunchtime, 45 minutes.']], files: ['Signed agreement.pdf', 'Program plan v2.pdf', 'Studio photos.jpg', 'Sample week.jpg'], up: ['Class times approved. Coaches are booked for the next 8 weeks.', 'Assessments are done. The program plan is in Files.'], req: ['Can we move Thursday to 12:30? Our meeting runs late.'] },
      { name: 'Strength program, 6 months', phases: ['Assessment', 'Phase 1: foundations', 'Phase 2: build', 'Phase 3: peak', 'Final assessment'], ob: ['Signed agreement', 'First payment received', 'Goals form'], ap: [['Change: add a monthly nutrition check-in', 'Adds $40 a month.']], files: ['Program plan.pdf', 'Assessment results.pdf', 'Progress photo.jpg'], up: ['Phase 2 is done. Phase 3 starts Monday.'] },
      { name: 'Team yoga sessions setup', phases: ['Kickoff call', 'Room survey', 'Schedule', 'First session'], ob: ['Signed agreement', 'Deposit received', 'Room details', 'Main contact'], files: ['Service agreement.pdf'], up: ['Thanks for choosing us. Please finish the checklist so we can schedule the first session.'] },
      { name: 'Couples training, 8 weeks', phases: ['Assessment', 'Weeks 1 to 4', 'Weeks 5 to 8', 'Final check-in'], ob: ['Signed agreement', 'Payment received'], ap: [['Schedule: Mondays and Wednesdays at 6 PM', '']], files: ['Results summary.pdf', 'Before and after.jpg'], up: ['All done. Your results summary is in Files. Great work!'] },
    ],
    ads: ['Gym near me - Search', 'Personal trainer - Search', 'Brand - Search', 'New year challenge', 'Retargeting - site visitors', 'Summer bootcamp promo'],
    keywords: [['gym near me', '/'], ['fitness studio riverside', '/'], ['personal trainer riverside', '/personal-training/'], ['personal trainer cost', '/pricing/'], ['group fitness classes', '/classes/'], ['yoga classes near me', '/classes/yoga/']],
    pages: [['/', 'Home'], ['/classes/', 'Classes'], ['/personal-training/', 'Personal training'], ['/book/', 'Book a class'], ['/pricing/', 'Pricing'], ['/reviews/', 'Reviews']],
    job: 180,
    duties: ['Open the studio and check voicemail', 'Set up the floor for today’s classes', null, 'Equipment safety check', 'Count retail stock and log usage', null, 'Post today’s class photos'],
    sops: [{ steps: ['Open tomorrow on the calendar', 'Text each member their class time', 'Call anyone who has not replied by 3 PM', 'Note requests on the booking', 'Flag cancellations to the front desk'] }, { title: 'Setting up for class', cat: 'Floor', steps: ['Check the class list', 'Lay out mats and weights', 'Test the speakers and mic', 'Turn on the fans', 'Wipe down benches'] }, { title: 'Equipment safety check', cat: 'Safety', steps: ['Cables and pulleys look undamaged', 'Bench pins lock in place', 'No loose plates on the floor', 'First aid kit is stocked', 'Log any issue on the equipment page'] }, { title: 'Closing the studio', steps: ['Rack all weights', 'Turn off treadmills and fans', 'Lock the retail cabinet', 'Set the alarm', 'Lock the front door'] }, { title: 'Handling a fall on the floor', cat: 'Floor', steps: ['Pause the class and stay with the member', 'Call for help if it looks serious', 'Fill out an incident report', 'Call the member the next day to check in'] }],
    equipment: [['Treadmill 1', 'Cardio'], ['Rowing machine', 'Cardio'], ['Cable machine', 'Strength'], ['Squat rack 2', 'Strength'], ['Sound system', 'Device'], ['Front desk tablet', 'Device']],
    equipHint: 'Machines, racks and devices: who looks after them and when each is due for service.',
    inventory: [['Protein bars', 'BAR-CHOC', 'each', 1.8, 'Fit Snacks Co.'], ['Water bottles', 'BTL-24', 'each', 6, 'Gym Gear Supply'], ['Resistance bands', 'BND-M', 'each', 9, 'Gym Gear Supply'], ['Disinfectant wipes', 'WPE-800', 'tub', 14, 'Clean Pro Supply'], ['Yoga mats', 'MAT-6MM', 'each', 18, 'Gym Gear Supply'], ['Towels', 'TWL-12', 'dozen', 24, 'Clean Pro Supply'], ['Studio T-shirts', 'TSH-M', 'each', 8, 'Print Shop']],
    templates: {
      seasonal: { subject: 'Start the new year strong', preview: 'Join this month and your first week is free.', heading: 'New year, new goals, {first_name}', body: 'The new year is around the corner. Join before December 15 and your first week is free. Classes fill fast in January, so grab your spot early.', cta: 'Claim my free week' },
      newsletter: { subject: 'Your November training tips', preview: 'Three quick habits that keep you moving.', heading: 'November training tips', body: 'Take a short walk after dinner, stretch for five minutes each morning and book two classes a week. Want help with a plan? Reply to this email or book online.' },
    },
    offerName: 'New year offer',
    seqSubjects: ['Ready when you are: book a free intro session', 'A quick tip to keep your progress going'],
    docs: { vendor: 'Gym Gear Supply', lines: ['Kettlebells, set', 'Resistance bands, box', 'Yoga mats'], merchant: 'Corner Coffee', category: 'Supplies', service: 'Personal training', work1: 'Fitness assessment and plan', work2: 'Personal training session', vendor2: 'Clean Pro Supply', lines2: ['Disinfectant, case', 'Towels, dozen'], old: ['Gym Gear Supply', 'Corner Coffee', 'Fit Snacks Co.', 'Clean Pro Supply', 'Gym Gear Supply', 'City Water Dept.'] },
  },

  pro: {
    scale: 0.3,
    roles: { u2: 'Senior Accountant', u3: 'Accountant', u4: 'Office Manager' },
    services: [['Free discovery call', 30, 0], ['Strategy session', 60, 150], ['Bookkeeping review', 60, 120], ['Tax planning meeting', 90, 250], ['Monthly check-in', 60, 200]],
    seriesNote: 'Weekly check-in with their finance team.',
    bookingNotes: ['Bring last year’s return.', 'Prefers video calls.', 'Send the agenda the day before.', 'Use the small conference room.'],
    notes: ['Asked about monthly pricing. Sent the proposal.', 'Prefers email over calls during the workday.', 'Wants everything set before year-end.', 'Comparing us with two other firms.', 'Discovery call went well. Needs a revised scope.', 'Budget approved by their board.', 'Interested in payroll after setup.', 'Left voicemail. Will try again Thursday.'],
    deals: ['Monthly bookkeeping, 12 months', 'Tax return and planning', 'Payroll setup and support', 'Year-end cleanup', 'HOA annual financial review', 'Personal tax return', 'Cash flow forecast', 'Business tax return', 'QuickBooks setup and training', 'Quarterly advisory package', 'Business plan and projections', 'Practice financial review', 'Sales tax filings', 'Personal tax return', 'Budget planning session', 'Property accounting, 48 units', 'Back taxes catch-up', 'Fractional CFO, 6 months', 'Bookkeeping check-up', 'Business sale advisory', 'Estate tax filing', 'Audit preparation', 'Business tax return', 'Payroll, 12 months', 'Cleanup and catch-up', 'Property management books'],
    estimates: ['Monthly bookkeeping', 'Personal tax return', 'Year-end cleanup', 'Payroll setup', 'Business tax return', 'QuickBooks setup', 'Cash flow forecast', 'Sales tax filings', 'Fractional CFO', 'Audit preparation', 'Quarterly advisory', 'Budget planning', 'Back taxes catch-up', 'Business plan', 'Estate tax filing', 'Bookkeeping check-up'],
    tickets: [['Need a report for my loan today', 'My bank needs my profit and loss statement by 3 PM today.'], ['Numbers look off in my monthly report', 'Hi, my October report shows less revenue than I expected. Can someone take a look?'], null, null, ['Bank feed stopped syncing', 'My bank transactions stopped showing up last week.', 'Probably the bank login expired. Asked them to reconnect.', 'Could you reconnect your bank in QuickBooks? That usually fixes it.'], ['Question about the monthly plan', 'Does the plan include a call each month?', 'Yes, a 30-minute call each month plus email support.'], ['Receipt missing from my books', 'A receipt I uploaded is not showing in my books.', 'Found it and added it today. Sorry about that!'], null],
    saved: [['Booking a meeting', 'Thanks for reaching out. I can set up a call. Does tomorrow at 10 AM work?'], ['Deadline question', 'Good question! You have until the 15th, and I will send a reminder a week before.'], ['Running late', 'Sorry for the wait. I am running about 15 minutes behind and will call you shortly.']],
    articles: [null, ['What does the monthly plan include?', 'Monthly books, a 30-minute review call and email support. You can cancel any time.'], ['How do I send you receipts?', 'Snap a photo in the app or email it to your inbox address. We match it to the transaction.', 'How-to'], null, ['What if I miss a tax deadline?', 'Tell us right away. We can file an extension and help with any penalties.']],
    feedback: ['Priya explained everything clearly.', 'Fast, friendly and organized.', 'Great work, just a bit slow to reply.', '', 'Helpful, but I had to send my files twice.', 'Best firm we have worked with.', '', 'Clear, careful and quick.'],
    projects: [
      { name: 'Year-end cleanup: Delgado Property Group', phases: ['Kickoff call', 'Gather documents', 'Clean up the books', 'Review together', 'Final reports'], ob: ['Signed agreement', 'Deposit received', 'Bank access', 'Last year’s return'], ap: [['Adjusting entries for October', 'Two reports attached. Please review by Friday.'], ['Chart of accounts changes', 'Merged six unused accounts.']], files: ['Signed agreement.pdf', 'Balance sheet v2.pdf', 'Bank statements.pdf', 'Receipts batch.pdf'], up: ['Chart of accounts approved. The cleanup starts Monday.', 'Kickoff is done. The document list is in Files.'], req: ['Can we meet after 4 PM? Mornings are busy for me.'] },
      { name: 'Business tax return', phases: ['Engagement letter', 'Gather documents', 'Prepare return', 'Review', 'File'], ob: ['Signed agreement', 'Deposit received', 'Prior year return'], ap: [['Change: add a state filing', 'Adds $340.']], files: ['Engagement letter.pdf', 'Prior return.pdf', '1099 forms.pdf'], up: ['The draft return is ready for review. We file once you approve.'] },
      { name: 'Payroll setup', phases: ['Kickoff call', 'Employee details', 'Payroll schedule', 'First payroll'], ob: ['Signed agreement', 'Deposit received', 'Employee list', 'Main contact for payroll'], files: ['Service agreement.pdf'], up: ['Thanks for choosing us. Please finish the checklist so we can run your first payroll.'] },
      { name: 'Fractional CFO, first quarter', phases: ['Kickoff', 'Budget', 'Forecast', 'Board review'], ob: ['Signed agreement', 'Deposit received'], ap: [['Budget for next year', '']], files: ['Quarterly report.pdf', 'Forecast.pdf'], up: ['All done. Your quarterly report is in Files. Thank you!'] },
    ],
    ads: ['Bookkeeping services - Search', 'Tax preparer near me - Search', 'Brand - Search', 'Year-end cleanup offer', 'Retargeting - site visitors', 'Tax season promo'],
    keywords: [['bookkeeper near me', '/'], ['accounting firm riverside', '/'], ['small business accountant', '/services/accounting/'], ['bookkeeping cost', '/pricing/'], ['tax preparer near me', '/services/taxes/'], ['quickbooks setup help', '/services/quickbooks/']],
    pages: [['/', 'Home'], ['/services/accounting/', 'Accounting'], ['/services/taxes/', 'Taxes'], ['/book/', 'Book a call'], ['/pricing/', 'Pricing'], ['/reviews/', 'Reviews']],
    job: 1200,
    duties: ['Open the office and check voicemail', 'Prep files for today’s meetings', null, 'Check last night’s backup', 'Review the month-end close list', null, 'File signed engagement letters'],
    sops: [{ steps: ['Open tomorrow on the calendar', 'Email each client the meeting link', 'Call anyone who has not replied by 3 PM', 'Note which documents to bring', 'Flag cancellations to the office manager'] }, { title: 'Prepping for a client meeting', cat: 'Office', steps: ['Open the client’s file', 'Share the latest reports', 'List open questions', 'Check the meeting link works', 'Send the agenda'] }, { title: 'Backup check', cat: 'Security', steps: ['Confirm last night’s backup finished', 'Open one file from the backup', 'Check the shared drive has space', 'Lock screens on idle computers', 'Log any issue on the equipment page'] }, { title: 'Closing the office', steps: ['Lock the file cabinets', 'Shut down the scanner', 'Lock the supply room', 'Set the alarm', 'Lock the front door'] }, { title: 'Handling a missed deadline', cat: 'Clients', steps: ['Tell the client the same day', 'File an extension if possible', 'Write down what happened', 'Set a reminder so it does not repeat'] }],
    equipment: [['Office scanner', 'Device'], ['Conference room screen', 'Device'], ['File server', 'Device'], ['Laptop 2', 'Device'], ['Shredder', 'Office'], ['Front desk tablet', 'Device']],
    equipHint: 'Computers, devices and office equipment: who has them and when each is due for service.',
    inventory: [['Printer paper', 'PPR-CASE', 'case', 42, 'Office Supply Co.'], ['Toner cartridges', 'TNR-BLK', 'each', 89, 'Office Supply Co.'], ['File folders', 'FLD-100', 'box', 18, 'Office Supply Co.'], ['Envelopes, 9x12', 'ENV-912', 'box', 16, 'Office Supply Co.'], ['Client binders', 'BND-1IN', 'each', 4.5, 'Print Shop'], ['Coffee pods', 'COF-48', 'box', 32, 'Corner Coffee'], ['Postage stamps', 'STM-100', 'roll', 73, 'Post Office']],
    templates: {
      seasonal: { subject: 'Get ready for tax season', preview: 'Book a planning meeting this month and save 15%.', heading: 'Tax season is coming, {first_name}', body: 'Tax season is around the corner. Book a planning meeting before December 15 and take 15% off. It takes about an hour and keeps surprises away in April.', cta: 'Book a meeting' },
      newsletter: { subject: 'Your year-end checklist', preview: 'Three quick jobs that save money this season.', heading: 'November year-end checklist', body: 'Gather your receipts, check your estimated tax payments and review your payroll records. Want us to handle any of it? Reply to this email or book online.' },
    },
    offerName: 'Tax season offer',
    seqSubjects: ['Ready when you are: book a free discovery call', 'A quick tip to keep your books tidy'],
    docs: { vendor: 'Office Supply Co.', lines: ['Printer paper, case', 'Toner cartridges', 'File folders, box'], merchant: 'Corner Coffee', category: 'Client meetings', service: 'Monthly bookkeeping', work1: 'Bank reconciliation, 3 accounts', work2: 'Payroll run', vendor2: 'Cloud Software Co.', lines2: ['Accounting software seats', 'Document storage plan'], old: ['Office Supply Co.', 'Corner Coffee', 'Print Shop', 'Cloud Software Co.', 'Office Supply Co.', 'City Water Dept.'] },
  },
};
