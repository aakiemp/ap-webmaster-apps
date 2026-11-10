/**
 * Fictional sample data. Every person, company, email address and phone
 * number here is made up (555-01xx numbers and example.* domains are
 * reserved for fiction). Dates are relative to "now" so the demo always
 * looks current.
 */
import { SCHEMA_VERSION } from './schema.js';

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const DAY = 86400000;

function at(daysAgo, hour = 10, minute = 0) {
  const d = new Date(Date.now() - daysAgo * DAY);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const USERS = [
  { id: 'u1', name: 'Jordan Ellis', role: 'Owner' },
  { id: 'u2', name: 'Priya Shah', role: 'Sales Lead' },
  { id: 'u3', name: 'Marcus Reed', role: 'Estimator' },
  { id: 'u4', name: 'Dana Cole', role: 'Office Manager' },
];

const STAGES = [
  { id: 'new', name: 'New Lead', probability: 0.1 },
  { id: 'contacted', name: 'Contacted', probability: 0.2 },
  { id: 'qualified', name: 'Qualified', probability: 0.4 },
  { id: 'proposal', name: 'Proposal Sent', probability: 0.6 },
  { id: 'negotiation', name: 'Negotiation', probability: 0.8 },
];

// [first, last, company, title, status, source, owner, city, tags, createdDaysAgo]
const PEOPLE = [
  ['Avery', 'Collins', '', '', 'customer', 'Referral', 'u2', 'Lakewood', ['Repeat'], 210],
  ['Rosa', 'Delgado', 'Delgado Property Group', 'Property Manager', 'customer', 'Website', 'u1', 'Fairview', ['Commercial', 'VIP'], 160],
  ['Ethan', 'Brooks', '', '', 'prospect', 'Google Ads', 'u2', 'Riverside', [], 21],
  ['Mei', 'Tanaka', '', '', 'lead', 'Website', 'u3', 'Brookfield', [], 2],
  ['Samuel', 'Okafor', 'Northgate Dental', 'Practice Administrator', 'prospect', 'Referral', 'u1', 'Westfield', ['Commercial'], 34],
  ['Grace', 'Whitman', '', '', 'customer', 'Repeat', 'u2', 'Oak Grove', ['Repeat'], 300],
  ['Luis', 'Ferreira', '', '', 'lead', 'Facebook', 'u3', 'Lakewood', [], 1],
  ['Hannah', 'Kim', 'Maple Ridge HOA', 'Board President', 'prospect', 'Website', 'u1', 'Maple Ridge', ['Commercial'], 45],
  ['Derek', 'Lawson', '', '', 'lead', 'Google Ads', 'u2', 'Fairview', [], 4],
  ['Nadia', 'Hassan', '', '', 'customer', 'Referral', 'u3', 'Riverside', [], 95],
  ['Owen', 'Price', 'Price & Sons Auto', 'Owner', 'prospect', 'Phone', 'u2', 'Westfield', ['Commercial'], 28],
  ['Julia', 'Moreno', '', '', 'lead', 'Website', 'u3', 'Brookfield', [], 6],
  ['Trevor', 'Walsh', '', '', 'inactive', 'Google Ads', 'u2', 'Lakewood', [], 400],
  ['Imani', 'Carter', '', '', 'prospect', 'Referral', 'u1', 'Oak Grove', [], 15],
  ['Victor', 'Nguyen', 'Harbor View Apartments', 'Facilities Director', 'customer', 'Trade show', 'u1', 'Harbor View', ['Commercial', 'VIP'], 240],
  ['Chloe', 'Bennett', '', '', 'lead', 'Facebook', 'u2', 'Fairview', [], 3],
  ['Marcus', 'Hale', '', '', 'prospect', 'Website', 'u3', 'Riverside', [], 11],
  ['Priyanka', 'Rao', '', '', 'customer', 'Referral', 'u2', 'Maple Ridge', ['Repeat'], 130],
  ['Benjamin', 'Ford', 'Ford Family Dentistry', 'Office Manager', 'lead', 'Phone', 'u1', 'Brookfield', ['Commercial'], 8],
  ['Elena', 'Petrova', '', '', 'prospect', 'Google Ads', 'u3', 'Westfield', [], 19],
  ['Kofi', 'Mensah', '', '', 'inactive', 'Website', 'u2', 'Lakewood', [], 365],
  ['Sophie', 'Laurent', '', '', 'lead', 'Website', 'u3', 'Oak Grove', [], 1],
  ['Isaac', 'Turner', 'Turner Storage', 'Owner', 'customer', 'Referral', 'u1', 'Harbor View', ['Commercial'], 180],
  ['Zoe', 'Ramirez', '', '', 'prospect', 'Facebook', 'u2', 'Fairview', [], 9],
];

// [title, personIndex, value, stage, status, owner, source, createdDaysAgo, closeInDays]
const DEALS = [
  ['Kitchen remodel', 2, 38500, 'proposal', 'open', 'u2', 'Google Ads', 18, 14],
  ['HVAC system replacement', 3, 12400, 'new', 'open', 'u3', 'Website', 2, 30],
  ['Office HVAC service agreement', 4, 9600, 'negotiation', 'open', 'u1', 'Referral', 30, 6],
  ['Roof replacement', 6, 21800, 'contacted', 'open', 'u3', 'Facebook', 1, 25],
  ['Clubhouse renovation', 7, 46000, 'qualified', 'open', 'u1', 'Website', 40, 45],
  ['Water heater install', 8, 2600, 'new', 'open', 'u2', 'Google Ads', 4, 10],
  ['Shop lighting and panel upgrade', 10, 14200, 'proposal', 'open', 'u2', 'Phone', 25, 12],
  ['Bathroom renovation', 11, 17900, 'contacted', 'open', 'u3', 'Website', 5, 28],
  ['Deck build', 13, 11300, 'qualified', 'open', 'u1', 'Referral', 14, 21],
  ['Window replacement, 14 windows', 15, 13650, 'new', 'open', 'u2', 'Facebook', 3, 35],
  ['Basement finishing', 16, 29400, 'negotiation', 'open', 'u3', 'Website', 10, 4],
  ['Dental suite HVAC zoning', 18, 18800, 'contacted', 'open', 'u1', 'Phone', 7, 30],
  ['Attic insulation', 19, 4200, 'proposal', 'open', 'u3', 'Google Ads', 16, 9],
  ['Gutter replacement', 21, 3100, 'new', 'open', 'u3', 'Website', 1, 20],
  ['Siding repair', 23, 6750, 'qualified', 'open', 'u2', 'Facebook', 8, 16],
  ['Annual maintenance, 48 units', 14, 42000, 'negotiation', 'won', 'u1', 'Trade show', 60, -12],
  ['Whole-home repiping', 9, 15800, 'proposal', 'won', 'u3', 'Referral', 50, -20],
  ['Storage facility roof coating', 22, 24500, 'negotiation', 'won', 'u1', 'Referral', 75, -35],
  ['Furnace tune-up plan', 17, 1800, 'proposal', 'won', 'u2', 'Referral', 20, -5],
  ['Sunroom addition', 12, 52000, 'proposal', 'lost', 'u2', 'Google Ads', 90, -40],
  ['Garage door replacement', 20, 3400, 'contacted', 'lost', 'u2', 'Website', 45, -15],
  ['Lobby remodel', 1, 31200, 'negotiation', 'won', 'u1', 'Website', 110, -60],
  ['Furnace replacement', 0, 7800, 'proposal', 'won', 'u2', 'Referral', 130, -105],
  ['Exterior repaint', 5, 12600, 'negotiation', 'won', 'u2', 'Website', 170, -135],
  ['Kitchen backsplash and lighting', 17, 9400, 'proposal', 'won', 'u3', 'Referral', 190, -160],
  ['Parking lot lighting retrofit', 14, 27500, 'negotiation', 'won', 'u1', 'Trade show', 200, -150],
];

const NOTES = [
  'Asked for financing options. Sent the brochure.',
  'Prefers text over calls during the workday.',
  'Wants work finished before the holidays.',
  'Comparing us with two other contractors.',
  'Site visit went well. Needs a revised scope.',
  'Budget approved by their board.',
  'Interested in a maintenance plan after install.',
  'Left voicemail. Will try again Thursday.',
];

export function createSeed() {
  const r = rng(20261109);
  const now = new Date().toISOString();

  const contacts = PEOPLE.map((p, i) => {
    const [firstName, lastName, company, title, status, source, ownerId, city, tags, created] = p;
    const handle = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, '');
    const domains = ['example.com', 'example.net', 'example.org'];
    return {
      id: `c${i + 1}`,
      firstName,
      lastName,
      company,
      title,
      email: `${handle}@${domains[i % 3]}`,
      phone: `(330) 555-01${String(10 + i).padStart(2, '0')}`,
      status,
      source,
      ownerId,
      city,
      state: 'OH',
      tags,
      createdAt: at(created, 9 + (i % 7), (i * 7) % 60),
      updatedAt: at(Math.max(0, created - 3)),
      lastActivityAt: null,
    };
  });

  const deals = DEALS.map((d, i) => {
    const [name, ci, value, stageId, status, ownerId, source, created, closeIn] = d;
    const contact = contacts[ci];
    return {
      id: `d${i + 1}`,
      name: `${name}`,
      contactId: contact.id,
      value,
      stageId,
      status,
      ownerId,
      source,
      expectedClose: at(-closeIn, 12),
      closedAt: status === 'open' ? null : at(Math.max(0, -closeIn), 15),
      lostReason: status === 'lost' ? (i % 2 ? 'Went with another contractor' : 'Postponed the project') : '',
      createdAt: at(created, 11),
      updatedAt: at(Math.max(0, Math.min(created, 3))),
    };
  });

  const activities = [];
  let n = 0;
  const add = (a) => activities.push({ id: `a${++n}`, userId: 'u1', ...a });

  contacts.forEach((c) => {
    add({ type: 'created', contactId: c.id, userId: c.ownerId, at: c.createdAt, text: `Contact created from ${c.source}` });
  });
  deals.forEach((d, i) => {
    const c = contacts.find((x) => x.id === d.contactId);
    add({ type: 'deal', contactId: c.id, dealId: d.id, userId: d.ownerId, at: d.createdAt, text: `Opportunity created: ${d.name}` });
    const touch = Math.max(0, Math.floor(r() * 6));
    const kinds = ['call', 'email', 'note', 'meeting'];
    const kind = kinds[i % 4];
    const text = {
      call: `Call with ${c.firstName}: ${NOTES[i % NOTES.length]}`,
      email: `Emailed ${c.firstName} the estimate for ${d.name.toLowerCase()}.`,
      note: NOTES[(i + 3) % NOTES.length],
      meeting: `On-site walkthrough for ${d.name.toLowerCase()}.`,
    }[kind];
    add({ type: kind, contactId: c.id, dealId: d.id, userId: d.ownerId, at: at(touch, 9 + (i % 8), (i * 13) % 60), text });
    if (d.status === 'won') add({ type: 'won', contactId: c.id, dealId: d.id, userId: d.ownerId, at: d.closedAt, text: `Deal won: ${d.name}` });
    if (d.status === 'lost') add({ type: 'lost', contactId: c.id, dealId: d.id, userId: d.ownerId, at: d.closedAt, text: `Deal lost: ${d.name} (${d.lostReason})` });
  });
  activities.sort((a, b) => (a.at < b.at ? 1 : -1));
  contacts.forEach((c) => {
    const last = activities.find((a) => a.contactId === c.id);
    c.lastActivityAt = last ? last.at : c.createdAt;
  });

  return {
    schema: SCHEMA_VERSION,
    seededAt: now,
    updatedAt: now,
    business: { name: 'Summit Home Services', industry: 'Home services' },
    currentUserId: 'u1',
    users: USERS,
    pipelines: [{ id: 'sales', name: 'Sales Pipeline', stages: STAGES }],
    sources: ['Website', 'Referral', 'Google Ads', 'Facebook', 'Phone', 'Trade show', 'Repeat'],
    contacts,
    deals,
    activities,
  };
}
