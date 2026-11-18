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
  { id: 'realestate', label: 'Real estate and property', icon: 'building', sample: 'Keystone Realty Group', word: 'agent' },
  { id: 'pro', label: 'Professional services', icon: 'briefcase', sample: 'Harbor Advisory Group', word: 'firm' },
  { id: 'agency', label: 'Marketing agency', icon: 'megaphone', sample: 'Northpoint Creative', word: 'agency' },
  { id: 'nonprofit', label: 'Nonprofit', icon: 'users', sample: 'Riverside Community Fund', word: 'charity' },
  { id: 'other', label: 'Something else', icon: 'grid', sample: 'Main Street Company', word: 'company' },
];

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY)) || {};
    // A business type that no longer exists: start that visitor over with fresh sample data.
    if (v.type && !TYPES.some((x) => x.id === v.type)) { localStorage.removeItem(KEY); localStorage.removeItem('apwa.demo'); return {}; }
    return v;
  } catch (e) { return {}; }
};
let cur = read();

export function type() { return TYPES.find((t) => t.id === cur.type) || TYPES[0]; }
/** True once the visitor has typed their own business name. */
export function custom() { return !!(cur.name && cur.name !== type().sample); }
export function name() { return (cur.name || '').trim() || type().sample; }
/** A made-up domain for sample addresses, e.g. "keystone-realty-group". */
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

  realestate: {
    scale: 0.6,
    roles: { u2: 'Broker', u3: 'Leasing Agent', u4: 'Office Manager' },
    services: [['Free home valuation call', 30, 0], ['Move-in inspection', 60, 75], ['Listing photo shoot', 60, 150], ['Owner monthly review', 60, 120], ['Property walkthrough', 60, 95]],
    seriesNote: 'Weekly walkthrough of their rental units.',
    bookingNotes: ['Lockbox code is in the listing file.', 'Buyer is pre-approved.', 'Bring the inspection checklist.', 'Tenant asked for an evening slot.'],
    notes: ['Asked about management fees. Sent the rate sheet.', 'Prefers text over calls during the workday.', 'Wants to list before the spring market.', 'Interviewing two other agents.', 'Walkthrough went well. Wants a revised price.', 'Owner approved the budget for repairs.', 'Interested in managing a second property later.', 'Left voicemail. Will try again Thursday.'],
    deals: ['Listing: 3-bed colonial', 'Property management, 12 units', 'Buyer search, first home', 'Lease-up, new duplex', 'HOA management contract', 'Rental listing, 2-bed condo', 'Tenant placement, 4 units', 'Listing: lakefront cottage', 'Property management, 6 units', 'Buyer search, relocation', 'Listing: downtown loft', 'Commercial lease, retail space', 'Rental listing, townhouse', 'Property management, 3 units', 'Buyer search, investor', 'Apartment complex, 48 units', 'Listing: ranch home', 'Property management, 20 units', 'Rental listing, studio', 'Listing: new construction', 'Tenant placement, 2 units', 'Owner portfolio review', 'Listing: split-level', 'Property management, 8 units', 'Buyer search, downsizing', 'Office suite lease'],
    estimates: ['Property management plan', 'Listing marketing package', 'Tenant placement', 'Lease renewal service', 'Make-ready repairs', 'Buyer representation', 'Rental analysis', 'Commercial lease service', 'Property management, 6 units', 'Home staging package', 'Move-out cleaning', 'Professional photos', 'Owner onboarding', 'HOA management', 'Vacation rental setup', 'Annual inspection plan'],
    tickets: [['No heat in unit 3B', 'The heat stopped working in our apartment last night and it is freezing.'], ['Rent payment not showing', 'Hi, I paid rent on the 1st but the portal still shows it as due. Can someone check?'], null, null, ['Security deposit question', 'My move-out statement shows $300 kept for cleaning but I left it spotless.', 'Checking the move-out photos against the checklist.', 'Could you send any photos you took on move-out day? I will compare them with ours.'], ['Question about renewing my lease', 'Can I renew for 6 months instead of 12?', 'Yes, a 6-month renewal is available for a small monthly premium.'], ['Dishwasher leaking', 'Our dishwasher leaks a little every time it runs.', 'A technician fixed the seal today. Thanks for telling us!'], null],
    saved: [['Booking a showing', 'Thanks for reaching out. I can show you the property. Does tomorrow at 5 PM work?'], ['Maintenance request', 'Thanks for letting us know. I have sent a technician and they will text you before arriving.'], ['Running late', 'Sorry for the wait. I am running about 15 minutes behind and will be there shortly.']],
    articles: [null, ['How do I pay rent online?', 'Open the tenant portal, tap Pay rent and choose your bank or card. Payments post the same day.'], ['How do I report a repair?', 'Use the portal or reply to any email from us. For no heat, no water or a leak, call the emergency line.', 'Tenants'], null, ['How does the security deposit work?', 'We return it within 30 days of move-out, minus any damage listed on your move-out checklist.']],
    feedback: ['Priya found us the perfect place.', 'Quick repairs and friendly staff.', 'Great service, just slow to call back.', '', 'Helpful, but the portal was confusing.', 'Best property manager we have had.', '', 'Professional, honest and on time.'],
    projects: [
      { name: 'Listing: 18 Maple Court', phases: ['Listing consultation', 'Photos and staging', 'Go live', 'Offers', 'Closing'], ob: ['Signed listing agreement', 'Seller disclosure', 'Keys or lockbox', 'HOA documents'], ap: [['List price: $389,000', 'Comparable sales attached.'], ['Listing photos', 'Twenty photos ready for the listing.']], files: ['Listing agreement.pdf', 'Comparable sales.pdf', 'Floor plan.pdf', 'Front photo.jpg'], up: ['Photos approved. The listing goes live Thursday morning.', 'Staging is done. Photos are in Files.'], req: ['Can we hold the open house on Sunday instead of Saturday?'] },
      { name: 'Property management: Delgado Rentals', phases: ['Owner onboarding', 'Inspect units', 'Set rents', 'Lease-up', 'Monthly reports'], ob: ['Signed management agreement', 'Owner bank details on file', 'Current leases'], ap: [['Change: add yearly HVAC service', 'Adds $90 per unit.']], files: ['Management agreement.pdf', 'Rent roll.pdf', 'Inspection report.pdf'], up: ['All units are inspected. The rent roll is in Files.'] },
      { name: 'Buyer search: first home', phases: ['Kickoff call', 'Pre-approval', 'Tour homes', 'Offer', 'Closing'], ob: ['Signed buyer agreement', 'Pre-approval letter', 'Must-have list', 'Preferred neighborhoods'], files: ['Buyer agreement.pdf'], up: ['Welcome! Please finish the checklist so we can start touring homes.'] },
      { name: 'Lease-up: Riverside duplex', phases: ['Make-ready', 'Photos', 'Showings', 'Signed leases'], ob: ['Signed agreement', 'Keys received'], ap: [['Rent: $1,650 per side', '']], files: ['Lease unit A.pdf', 'Move-in photos.jpg'], up: ['Both sides are leased. Signed leases are in Files. Thank you!'] },
    ],
    ads: ['Homes for sale near me - Search', 'Property management - Search', 'Brand - Search', 'Free home valuation offer', 'Retargeting - site visitors', 'Spring listing promo'],
    keywords: [['realtor near me', '/'], ['real estate agent riverside', '/'], ['property management riverside', '/property-management/'], ['what is my home worth', '/home-value/'], ['rentals near me', '/rentals/'], ['homes for sale riverside', '/listings/']],
    pages: [['/', 'Home'], ['/listings/', 'Listings'], ['/property-management/', 'Property management'], ['/book/', 'Book a showing'], ['/home-value/', 'Home value'], ['/reviews/', 'Reviews']],
    job: 2400,
    duties: ['Open the office and check voicemail', 'Confirm today’s showings', null, 'Check vacant units', 'Review new maintenance requests', null, 'Post new listings to social media'],
    sops: [{ steps: ['Open tomorrow on the calendar', 'Text each client their showing time', 'Call anyone who has not replied by 3 PM', 'Note lockbox details on the booking', 'Flag cancellations to the office manager'] }, { title: 'Preparing a showing', cat: 'Showings', steps: ['Check the lockbox code', 'Turn on the lights', 'Open blinds and windows', 'Set out flyers', 'Lock up and text the owner'] }, { title: 'Move-in inspection', cat: 'Leasing', steps: ['Photograph every room', 'Test smoke detectors', 'Note any damage on the checklist', 'Have the tenant sign the checklist', 'Hand over keys'] }, { title: 'Closing the office', steps: ['Lock the key cabinet', 'Shut down the printer', 'Lock the file room', 'Set the alarm', 'Lock the front door'] }, { title: 'Handling an emergency repair', cat: 'Maintenance', steps: ['Get the tenant somewhere safe', 'Send the on-call technician', 'Tell the owner the same day', 'Log the repair on the property'] }],
    equipment: [['Key cabinet', 'Office'], ['Lockbox set', 'Showings'], ['Camera kit', 'Device'], ['Moisture meter', 'Tool'], ['Company vehicle', 'Vehicle'], ['Front desk tablet', 'Device']],
    equipHint: 'Keys, lockboxes, tools and vehicles: who has them and when each is due for service.',
    inventory: [['Lockboxes', 'LKB-01', 'each', 45, 'Realty Supply Co.'], ['Yard signs', 'SGN-24', 'each', 28, 'Print Shop'], ['Listing flyers', 'FLY-500', 'pack', 35, 'Print Shop'], ['Smoke detectors', 'SMK-10', 'each', 18, 'Hardware Supply'], ['Air filters', 'FLT-20', 'each', 7, 'Hardware Supply'], ['Door locks', 'LCK-KW', 'each', 32, 'Hardware Supply'], ['Welcome kits', 'WEL-01', 'each', 12, 'Print Shop']],
    templates: {
      seasonal: { subject: 'Thinking of selling in the spring?', preview: 'Get a free home value report this month.', heading: 'What is your home worth, {first_name}?', body: 'Spring is the busiest time to sell. Ask for a free home value report before December 15 and I will show you what homes like yours sold for this year.', cta: 'Get my home value' },
      newsletter: { subject: 'Your winter home checklist', preview: 'Three quick jobs that protect your property.', heading: 'November home checklist', body: 'Change the furnace filter, clear the gutters and test your smoke detectors. Thinking about buying, selling or renting out a home? Reply to this email or book a call.' },
    },
    offerName: 'Free home value offer',
    seqSubjects: ['Ready when you are: book a free consultation', 'A quick tip for your next move'],
    docs: { vendor: 'Hardware Supply', lines: ['Smoke detectors', 'Air filters, case', 'Door locks'], merchant: 'Corner Coffee', category: 'Client meetings', service: 'Tenant placement', work1: 'Make-ready repairs, unit 3B', work2: 'Move-in inspection', vendor2: 'Print Shop', lines2: ['Yard signs', 'Listing flyers'], old: ['Hardware Supply', 'Corner Coffee', 'Print Shop', 'Realty Supply Co.', 'Hardware Supply', 'City Water Dept.'] },
  },

  agency: {
    scale: 0.8,
    roles: { u2: 'Account Director', u3: 'Designer', u4: 'Project Coordinator' },
    services: [['Free discovery call', 30, 0], ['Strategy workshop', 120, 450], ['Website edit session', 60, 95], ['Brand photo shoot', 180, 600], ['Monthly status call', 60, 150]],
    seriesNote: 'Weekly status call with their marketing team.',
    bookingNotes: ['Share the latest report before the call.', 'Prefers video calls.', 'Send the agenda the day before.', 'Bring the new homepage mockups.'],
    notes: ['Asked about retainer pricing. Sent the proposal.', 'Prefers email over calls during the workday.', 'Wants the new site live before the holidays.', 'Comparing us with two other agencies.', 'Discovery call went well. Needs a revised scope.', 'Budget approved by their owner.', 'Interested in paid ads after the launch.', 'Left voicemail. Will try again Thursday.'],
    deals: ['Website redesign', 'SEO retainer, 12 months', 'Google Ads management', 'Brand refresh', 'HOA website and newsletter', 'Landing page', 'Social media retainer', 'Email marketing setup', 'Website care plan', 'Logo and brand kit', 'E-commerce build', 'Local SEO package', 'Video ad campaign', 'Website speed fix', 'Monthly content plan', 'Multi-location site', 'Paid social campaign', 'Franchise web rollout', 'Hosting and support', 'Product launch campaign', 'Photo shoot', 'Annual marketing plan', 'Website redesign', 'Ads and landing pages', 'Analytics setup', 'Rebrand and new site'],
    estimates: ['Website redesign', 'SEO retainer', 'Google Ads management', 'Brand refresh', 'Landing page', 'Social media retainer', 'Email marketing setup', 'Website care plan', 'E-commerce build', 'Local SEO package', 'Video ad campaign', 'Content plan', 'Analytics setup', 'Photo shoot', 'Paid social campaign', 'Logo and brand kit'],
    tickets: [['Website is down', 'Our homepage is showing an error and customers are calling.'], ['Form leads stopped arriving', 'Hi, we have not received a contact form email since Monday. Can someone take a look?'], null, null, ['Ad spend looks higher than planned', 'Our ad account shows $600 more than the budget this month.', 'Probably the holiday campaign. Checking the daily caps.', 'Could you confirm whether the holiday campaign was meant to run this week? I will check the caps for you.'], ['Question about the care plan', 'Does the care plan include small content edits?', 'Yes, up to 2 hours of edits a month plus updates and backups.'], ['Typo on the services page', 'There is a typo in the second heading on our services page.', 'Fixed it today. Thanks for telling us!'], null],
    saved: [['Booking a call', 'Thanks for reaching out. I can set up a call. Does tomorrow at 10 AM work?'], ['Change request', 'Good question! That fits in your plan. I will have it done by Friday and send you a preview.'], ['Running late', 'Sorry for the wait. I am running about 15 minutes behind and will join shortly.']],
    articles: [null, ['What does the care plan include?', 'Updates, daily backups, uptime checks and 2 hours of edits a month. You can cancel any time.'], ['How do I request a change?', 'Open the client portal and tap New request, or reply to any email from us. Add a screenshot if you can.', 'How-to'], null, ['How fast do you fix a site that is down?', 'We start within the hour during business hours. Care plan clients get after-hours help too.']],
    feedback: ['Priya made the whole redesign easy.', 'Fast, creative and organized.', 'Great work, just a bit slow to reply.', '', 'Helpful, but feedback rounds took a while.', 'Best agency we have worked with.', '', 'Clear, careful and quick.'],
    projects: [
      { name: 'Website redesign: Delgado Roofing', phases: ['Kickoff call', 'Sitemap and wireframes', 'Design', 'Build', 'Launch'], ob: ['Signed agreement', 'Deposit received', 'Logo files', 'Website login'], ap: [['Homepage design', 'Desktop and phone mockups attached.'], ['Sitemap', 'Twelve pages, two new service pages.']], files: ['Signed agreement.pdf', 'Sitemap v2.pdf', 'Homepage mockup.jpg', 'Brand guide.pdf'], up: ['Sitemap approved. Design starts Monday.', 'Kickoff is done. Notes are in Files.'], req: ['Can we add a careers page to the menu?'] },
      { name: 'SEO retainer, first quarter', phases: ['Audit', 'Fix technical issues', 'Content plan', 'Monthly reports'], ob: ['Signed agreement', 'Deposit received', 'Search Console access'], ap: [['Change: add two blog posts a month', 'Adds $400 a month.']], files: ['SEO audit.pdf', 'Keyword plan.pdf', 'October report.pdf'], up: ['Technical fixes are live. The October report is in Files.'] },
      { name: 'Brand refresh', phases: ['Kickoff call', 'Mood boards', 'Logo options', 'Brand guide'], ob: ['Signed agreement', 'Deposit received', 'Current logo files', 'Main contact'], files: ['Service agreement.pdf'], up: ['Thanks for choosing us. Please finish the checklist so we can start the mood boards.'] },
      { name: 'Google Ads launch', phases: ['Account setup', 'Ads and keywords', 'Landing page', 'Go live'], ob: ['Signed agreement', 'Ad account access'], ap: [['Ad copy, round 2', '']], files: ['Results summary.pdf', 'Landing page.jpg'], up: ['All done. Your first month results are in Files. Thank you!'] },
    ],
    ads: ['Web design near me - Search', 'Marketing agency - Search', 'Brand - Search', 'Free website audit offer', 'Retargeting - site visitors', 'New year marketing promo'],
    keywords: [['web design near me', '/'], ['marketing agency riverside', '/'], ['seo services riverside', '/services/seo/'], ['website redesign cost', '/pricing/'], ['google ads management', '/services/ads/'], ['wordpress developer', '/services/web-design/']],
    pages: [['/', 'Home'], ['/services/web-design/', 'Web design'], ['/services/seo/', 'SEO'], ['/book/', 'Book a call'], ['/pricing/', 'Pricing'], ['/work/', 'Our work']],
    job: 3500,
    duties: ['Check client sites are up', 'Review today’s deadlines', null, 'Check last night’s backups', 'Review ad budgets', null, 'Post a project to social media'],
    sops: [{ steps: ['Open tomorrow on the calendar', 'Email each client the meeting link', 'Call anyone who has not replied by 3 PM', 'Note what to review on the booking', 'Flag cancellations to the coordinator'] }, { title: 'Launching a website', cat: 'Projects', steps: ['Back up the old site', 'Point the domain', 'Test every form', 'Check phone layouts', 'Submit the sitemap'] }, { title: 'Backup check', cat: 'Security', steps: ['Confirm last night’s backups finished', 'Restore one file as a test', 'Check storage space', 'Update plugins on staging first', 'Log any issue on the equipment page'] }, { title: 'Closing the studio', steps: ['Save and sync all files', 'Shut down the render machine', 'Lock the camera cabinet', 'Set the alarm', 'Lock the front door'] }, { title: 'Handling a site outage', cat: 'Clients', steps: ['Tell the client within the hour', 'Restore from the last backup', 'Write down what happened', 'Set up a check so it does not repeat'] }],
    equipment: [['Design workstation', 'Device'], ['Camera kit', 'Device'], ['Studio lights', 'Equipment'], ['Conference room screen', 'Device'], ['Laptop 2', 'Device'], ['Front desk tablet', 'Device']],
    equipHint: 'Computers, cameras and devices: who has them and when each is due for service.',
    inventory: [['Printer paper', 'PPR-CASE', 'case', 42, 'Office Supply Co.'], ['Business cards', 'BCD-500', 'box', 38, 'Print Shop'], ['Backup drives', 'HDD-2TB', 'each', 79, 'Tech Supply Co.'], ['Camera batteries', 'BAT-CAM', 'each', 45, 'Tech Supply Co.'], ['Presentation folders', 'FLD-50', 'pack', 30, 'Print Shop'], ['Coffee pods', 'COF-48', 'box', 32, 'Corner Coffee'], ['Sticky notes', 'STK-24', 'pack', 14, 'Office Supply Co.']],
    templates: {
      seasonal: { subject: 'Plan next year’s marketing now', preview: 'Book a planning workshop this month and save 15%.', heading: 'Ready for a bigger year, {first_name}?', body: 'The new year is around the corner. Book a marketing planning workshop before December 15 and take 15% off. You leave with a clear plan for your site, ads and email.', cta: 'Book my workshop' },
      newsletter: { subject: 'Your year-end website checklist', preview: 'Three quick fixes that bring in more leads.', heading: 'November website checklist', body: 'Test your contact forms, update your holiday hours and check your site on a phone. Want us to handle any of it? Reply to this email or book a call.' },
    },
    offerName: 'Planning workshop offer',
    seqSubjects: ['Ready when you are: book a free discovery call', 'A quick tip to get more leads from your site'],
    docs: { vendor: 'Tech Supply Co.', lines: ['Backup drives', 'Camera batteries', 'USB-C hubs'], merchant: 'Corner Coffee', category: 'Client meetings', service: 'Website care plan', work1: 'Homepage redesign, round 2', work2: 'Monthly SEO report', vendor2: 'Cloud Software Co.', lines2: ['Design software seats', 'Stock photo plan'], old: ['Tech Supply Co.', 'Corner Coffee', 'Print Shop', 'Cloud Software Co.', 'Office Supply Co.', 'City Water Dept.'] },
  },

  nonprofit: {
    scale: 0.4,
    roles: { u2: 'Program Director', u3: 'Volunteer Coordinator', u4: 'Office Manager' },
    services: [['Volunteer orientation', 60, 0], ['Workshop seat', 90, 25], ['Hall rental, 2 hours', 120, 150], ['Youth program session', 60, 40], ['Pantry delivery', 60, 35]],
    seriesNote: 'Weekly pantry delivery to their senior center.',
    bookingNotes: ['First time volunteering with us.', 'Interested in monthly giving.', 'Bring the program brochure.', 'Prefers an evening slot.'],
    notes: ['Asked about sponsorship levels. Sent the packet.', 'Prefers email over calls during the workday.', 'Wants to give before year-end.', 'Also supports two other local charities.', 'Tour went well. Wants to bring their team.', 'Gift approved by their foundation board.', 'Interested in volunteering after the gala.', 'Left voicemail. Will try again Thursday.'],
    deals: ['Gala sponsorship, gold', 'Monthly giving, 12 months', 'Corporate matching gift', 'Year-end gift', 'Neighborhood association grant', 'Volunteer day sponsor', 'Program grant, youth', 'Table at the gala', 'Annual fund gift', 'Food drive sponsor', 'Gala sponsorship, silver', 'Employee giving campaign', 'In-kind donation', 'Scholarship fund gift', 'Capital campaign pledge', 'Community foundation grant', 'Event sponsor, 5K walk', 'Corporate partnership, yearly', 'Monthly giving', 'Planned gift', 'Memorial gift', 'Holiday drive sponsor', 'Annual fund gift', 'Program grant, seniors', 'Workplace giving', 'Building fund pledge'],
    estimates: ['Gala sponsorship package', 'Corporate partnership', 'Program sponsorship', 'Event sponsor package', 'Volunteer day package', 'Table at the gala', 'Scholarship naming', 'Food drive sponsorship', 'Capital campaign pledge', 'Employee giving program', 'Annual fund proposal', 'Holiday drive package', 'Youth program grant', 'Senior program grant', '5K walk sponsorship', 'Monthly giving plan'],
    tickets: [['Can’t find my tax receipt', 'I need my donation receipt for my taxes and I cannot find the email.'], ['Charged twice for my donation', 'Hi, I see two charges for my monthly gift this month. Can someone check?'], null, null, ['Volunteer hours look wrong', 'My hours show 6 but I think I did 10 this month.', 'Probably a missed sign-in on Saturday. Checking the sheet.', 'Could you tell me which shifts you worked this month? I will check the sign-in sheet for you.'], ['Question about matching gifts', 'Does my employer match count toward the campaign?', 'Yes, matched gifts count toward the campaign total.'], ['Event check-in link broken', 'The check-in link for Saturday’s event does not open.', 'Fixed it today. Thanks for telling us!'], null],
    saved: [['Booking a visit', 'Thanks for reaching out. I can show you around. Does tomorrow at 10 AM work?'], ['Donation question', 'Great question! Every gift is tax-deductible and you get a receipt by email right away.'], ['Running late', 'Sorry for the wait. I am running about 15 minutes behind and will be with you shortly.']],
    articles: [null, ['How does monthly giving work?', 'Pick an amount, and we charge it on the same day each month. You can change or stop it any time.'], ['How do I sign up to volunteer?', 'Pick a shift on the volunteer page and come to a short orientation first. We will text you a reminder.', 'Volunteers'], null, ['Is my donation tax-deductible?', 'Yes. We are a registered charity and email you a receipt for every gift.']],
    feedback: ['Priya made volunteering so easy.', 'Welcoming and well organized.', 'Great event, just a long line at check-in.', '', 'Lovely, but the donation page was confusing.', 'Best cause in town.', '', 'Warm, clear and so grateful.'],
    projects: [
      { name: 'Spring gala: Delgado Family Foundation', phases: ['Sponsor kickoff', 'Logo and recognition', 'Event plan', 'Gala night', 'Thank-you report'], ob: ['Signed sponsorship agreement', 'Pledge received', 'Logo files', 'Guest list'], ap: [['Recognition: logo on the main banner', 'Banner proof attached.'], ['Table placement: front row', 'Two tables of ten.']], files: ['Sponsorship agreement.pdf', 'Event plan v2.pdf', 'Banner proof.jpg', 'Venue map.pdf'], up: ['Banner approved. Printing starts Monday.', 'Kickoff is done. The event plan is in Files.'], req: ['Can our CEO say a few words at the start?'] },
      { name: 'Youth program grant', phases: ['Application', 'Award letter', 'Program kickoff', 'Mid-year report', 'Final report'], ob: ['Signed grant agreement', 'First payment received', 'Program budget'], ap: [['Change: add a summer session', 'Adds $2,400 to the budget.']], files: ['Grant agreement.pdf', 'Program budget.pdf', 'Mid-year report.pdf'], up: ['The mid-year report is in Files. 42 students enrolled so far.'] },
      { name: 'Corporate volunteer day', phases: ['Kickoff call', 'Pick a project', 'Sign up volunteers', 'Volunteer day'], ob: ['Signed agreement', 'Volunteer list', 'T-shirt sizes', 'Main contact'], files: ['Partnership agreement.pdf'], up: ['Thanks for partnering with us. Please finish the checklist so we can plan the day.'] },
      { name: 'Holiday food drive', phases: ['Plan', 'Collect', 'Sort', 'Deliver'], ob: ['Signed agreement', 'Drop-off locations'], ap: [['Flyer design', '']], files: ['Impact summary.pdf', 'Drive photos.jpg'], up: ['All done. 3,200 meals delivered. Your impact summary is in Files. Thank you!'] },
    ],
    ads: ['Donate to local charity - Search', 'Volunteer near me - Search', 'Brand - Search', 'Year-end giving campaign', 'Retargeting - site visitors', 'Spring gala promo'],
    keywords: [['volunteer near me', '/'], ['local charity riverside', '/'], ['donate to food bank', '/donate/'], ['volunteer opportunities riverside', '/volunteer/'], ['charity gala tickets', '/events/gala/'], ['youth programs riverside', '/programs/']],
    pages: [['/', 'Home'], ['/donate/', 'Donate'], ['/volunteer/', 'Volunteer'], ['/events/', 'Events'], ['/programs/', 'Programs'], ['/impact/', 'Our impact']],
    job: 250,
    duties: ['Open the center and check voicemail', 'Set up for today’s volunteers', null, 'Check the pantry shelves', 'Log yesterday’s donations', null, 'Post today’s volunteer photos'],
    sops: [{ steps: ['Open tomorrow on the calendar', 'Text each volunteer their shift', 'Call anyone who has not replied by 3 PM', 'Note any special needs on the booking', 'Flag cancellations to the coordinator'] }, { title: 'Welcoming new volunteers', cat: 'Volunteers', steps: ['Check them in on the sign-in sheet', 'Give the safety talk', 'Hand out name tags', 'Pair them with a lead', 'Thank them before they leave'] }, { title: 'Logging a donation', cat: 'Donors', steps: ['Record the amount and donor', 'Send the tax receipt the same day', 'Add a thank-you note', 'Tag any matching gift', 'File the check for deposit'] }, { title: 'Closing the center', steps: ['Lock the pantry', 'Turn off the lights and heat', 'Lock the donation box', 'Set the alarm', 'Lock the front door'] }, { title: 'Handling a donor concern', cat: 'Donors', steps: ['Listen and thank them for telling you', 'Fix the receipt or charge the same day', 'Write down what happened', 'Call the next day to check in'] }],
    equipment: [['Delivery van', 'Vehicle'], ['Walk-in freezer', 'Equipment'], ['Folding tables', 'Furniture'], ['PA system', 'Device'], ['Check-in tablet', 'Device'], ['Front desk tablet', 'Device']],
    equipHint: 'Vehicles, kitchen equipment and devices: who looks after them and when each is due for service.',
    inventory: [['Canned goods', 'CAN-24', 'case', 18, 'Food Bank Supply'], ['Grocery bags', 'BAG-500', 'box', 22, 'Packaging Co.'], ['Volunteer T-shirts', 'TSH-M', 'each', 8, 'Print Shop'], ['Name tags', 'TAG-100', 'box', 9, 'Office Supply Co.'], ['Thank-you cards', 'CRD-50', 'pack', 15, 'Print Shop'], ['Hand sanitizer', 'SAN-GAL', 'gallon', 24, 'Clean Pro Supply'], ['Coffee', 'COF-5LB', 'bag', 28, 'Corner Coffee']],
    templates: {
      seasonal: { subject: 'Your gift goes twice as far this month', preview: 'A local sponsor is matching every gift until December 31.', heading: 'Double your impact, {first_name}', body: 'Every gift made before December 31 is matched by a local sponsor, up to $10,000. That means twice the meals, twice the classes and twice the help for families here at home.', cta: 'Give today' },
      newsletter: { subject: 'Your November impact update', preview: 'What your support made possible this month.', heading: 'November impact update', body: 'This month, volunteers packed 1,800 meals, 42 students joined our after-school program and the spring gala committee got to work. Want to help? Reply to this email or sign up for a shift.' },
    },
    offerName: 'Year-end match campaign',
    seqSubjects: ['Ready when you are: sign up for a volunteer shift', 'See what your gift made possible'],
    docs: { vendor: 'Food Bank Supply', lines: ['Canned goods, case', 'Rice, 25 lb', 'Grocery bags, box'], merchant: 'Corner Coffee', category: 'Volunteer refreshments', service: 'Gala sponsorship', work1: 'Event catering deposit', work2: 'Table at the gala', vendor2: 'Print Shop', lines2: ['Volunteer T-shirts', 'Gala programs'], old: ['Food Bank Supply', 'Corner Coffee', 'Print Shop', 'Clean Pro Supply', 'Food Bank Supply', 'City Water Dept.'] },
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
