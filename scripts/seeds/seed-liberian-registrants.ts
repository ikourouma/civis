// Generate 500 realistic Liberian diaspora registrants for the Liberia tenant.
// Idempotent — skips if the tenant already has >= 400 registrants.
// Run (after seed:liberia): npx tsx scripts/seeds/seed-liberian-registrants.ts
import { seedClient, writeSeedAudit } from './_client';

const MALE = ['George', 'James', 'Joseph', 'William', 'Samuel', 'Emmanuel', 'Moses', 'Abraham', 'David', 'Isaac', 'Patrick', 'Charles', 'Thomas', 'Daniel', 'Andrew', 'Edward', 'Francis', 'Gabriel', 'Henry', 'Peter'];
const FEMALE = ['Mary', 'Martha', 'Grace', 'Ruth', 'Comfort', 'Patience', 'Victoria', 'Gloria', 'Elizabeth', 'Sarah', 'Agnes', 'Cecilia', 'Dorothy', 'Helen', 'Josephine', 'Lucy', 'Margaret', 'Naomi', 'Precious', 'Rebecca'];
const LAST = ['Johnson', 'Williams', 'Brown', 'Cooper', 'Dennis', 'Freeman', 'Harris', 'Howard', 'Jones', 'King', 'Moore', 'Roberts', 'Taylor', 'Washington', 'Weah', 'Sirleaf', 'Barclay', 'Tubman', 'Tolbert', 'Doe', 'Gbowee', 'Sawyer', 'Sherman', 'Monger', 'Kollie', 'Flomo'];

// [code, name, count]
const COUNTRY_PLAN: [string, string, number][] = [
  ['US', 'United States', 225],
  ['GH', 'Ghana', 60],
  ['NG', 'Nigeria', 40],
  ['GB', 'United Kingdom', 35],
  ['FR', 'France', 25],
  ['SL', 'Sierra Leone', 25],
  ['DE', 'Germany', 20],
  ['CA', 'Canada', 20],
  ['CI', "Côte d'Ivoire", 15],
];
const OTHER_COUNTRIES: [string, string][] = [
  ['SN', 'Senegal'], ['ML', 'Mali'], ['GN', 'Guinea'], ['ZA', 'South Africa'],
  ['AU', 'Australia'], ['BE', 'Belgium'], ['NL', 'Netherlands'], ['IT', 'Italy'],
  ['SE', 'Sweden'], ['AE', 'United Arab Emirates'],
];

const US_CITIES: [string, number][] = [
  ['Minneapolis', 30], ['Philadelphia', 15], ['Providence', 10], ['Staten Island', 10],
  ['Silver Spring', 12], ['Atlanta', 8], ['Newark', 5], ['Columbus', 5], ['Worcester', 5],
];
const CITY_BY_COUNTRY: Record<string, string[]> = {
  GH: ['Accra', 'Kumasi', 'Tema'], NG: ['Lagos', 'Abuja', 'Port Harcourt'],
  GB: ['London', 'Manchester', 'Birmingham'], FR: ['Paris', 'Lyon', 'Marseille'],
  SL: ['Freetown', 'Bo', 'Kenema'], DE: ['Berlin', 'Hamburg', 'Frankfurt'],
  CA: ['Toronto', 'Ottawa', 'Brampton'], CI: ['Abidjan', 'Yamoussoukro'],
};

const OCCUPATIONS = ['Registered Nurse', 'Nurse', 'Teacher', 'Software Engineer', 'Taxi Driver', 'Business Owner', 'Student', 'Accountant', 'Social Worker', 'Civil Engineer', 'Retail Sales Associate', 'Chef', 'Administrative Assistant', 'Lawyer', 'Physician', 'Pharmacist', 'Truck Driver'];
const EDUCATION: [string, number][] = [
  ['No formal education', 3], ['Primary school', 5], ['Secondary school / High school', 15],
  ['Technical / Vocational training', 12], ['Some college / University (no degree)', 10],
  ['Associate degree / Diploma', 8], ["Bachelor's degree", 25], ["Master's degree", 15], ['Doctorate / PhD', 7],
];
const GENERATION: [string, number][] = [['first', 65], ['second', 25], ['third', 5], ['returnee', 5]];
const STATUS: [string, number][] = [['draft', 3], ['basic_registered', 10], ['submitted', 15], ['active', 72]];
const AGE_COHORTS: [number, number, number][] = [
  [18, 25, 12], [26, 35, 28], [36, 45, 25], [46, 55, 20], [56, 65, 10], [66, 80, 5],
];
const ASSOCIATIONS = ['Union of Liberian Associations', 'Liberian Community Association', 'Bassa Association', 'Liberian Diaspora Network'];

function weighted<T>(items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of items) {
    if ((r -= w) <= 0) return v;
  }
  return items[0]![0];
}
const rand = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

// Registration date over the last 18 months, weighted toward recent (growth curve).
function registrationDate(): string {
  const monthsAgo = Math.floor(18 * Math.pow(Math.random(), 0.6)); // bias toward recent
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(randInt(1, 28));
  return d.toISOString();
}

function dobForAge(min: number, max: number): string {
  const age = randInt(min, max);
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  d.setMonth(randInt(0, 11));
  d.setDate(randInt(1, 28));
  return d.toISOString().split('T')[0]!;
}

async function main() {
  const admin = seedClient();
  console.log('Seeding synthetic Liberian diaspora registrants...\n');

  const { data: tenant } = await admin.from('civis_tenants').select('id').eq('country_code', 'LR').maybeSingle();
  if (!tenant) {
    console.error('❌ Liberia tenant not found. Run: npx tsx scripts/seeds/seed-liberia-tenant.ts');
    process.exit(1);
  }
  const { data: embassy } = await admin
    .from('civis_embassies')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('host_country_code', 'US')
    .maybeSingle();

  const { count } = await admin
    .from('civis_registrants')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id);

  if ((count ?? 0) >= 400) {
    console.log(`Already ${count} registrants — skipping seed.`);
    return;
  }

  // Build a country pool of 500 entries
  const countryPool: [string, string][] = [];
  for (const [code, name, n] of COUNTRY_PLAN) for (let i = 0; i < n; i++) countryPool.push([code, name]);
  while (countryPool.length < 500) countryPool.push(rand(OTHER_COUNTRIES));

  const rows = countryPool.map(([code, name]) => {
    const isMale = Math.random() < 0.49;
    const gender = Math.random() < 0.02 ? 'prefer_not_to_say' : isMale ? 'male' : 'female';
    const firstName = isMale ? rand(MALE) : rand(FEMALE);
    const lastName = rand(LAST);
    const [aMin, aMax] = weighted(AGE_COHORTS.map(([lo, hi, w]) => [[lo, hi], w] as [[number, number], number]));
    const status = weighted(STATUS);
    const createdAt = registrationDate();

    const cityList = CITY_BY_COUNTRY[code];
    const city = code === 'US' ? weighted(US_CITIES) : cityList ? rand(cityList) : name;

    const completeness =
      status === 'active' ? randInt(70, 100) :
      status === 'submitted' ? randInt(50, 85) :
      status === 'basic_registered' ? randInt(20, 40) : randInt(10, 30);

    const verification =
      status === 'active' ? 'verified' :
      status === 'submitted' ? 'pending_review' : 'unverified';

    const entryYear = new Date(createdAt).getFullYear() - randInt(1, 30);

    return {
      tenant_id: tenant.id,
      embassy_id: code === 'US' ? embassy?.id ?? null : null,
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dobForAge(aMin, aMax),
      gender,
      nationality: 'Liberian',
      country_of_birth: 'Liberia',
      country_of_residence: name,
      city_of_residence: city,
      entry_year: entryYear,
      years_abroad: new Date().getFullYear() - entryYear,
      occupation: status === 'draft' ? null : rand(OCCUPATIONS),
      education_level: status === 'draft' ? null : weighted(EDUCATION),
      generation: weighted(GENERATION),
      diaspora_association: Math.random() < 0.25 ? rand(ASSOCIATIONS) : null,
      return_interest: Math.random() < 0.4,
      investment_interest: Math.random() < 0.3,
      registration_status: status,
      verification_status: verification,
      verified_at: verification === 'verified' ? createdAt : null,
      consent_captured: status !== 'draft',
      consent_captured_at: status !== 'draft' ? createdAt : null,
      profile_completeness_score: completeness,
      created_at: createdAt,
    };
  });

  let inserted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const { error, count: c } = await admin.from('civis_registrants').insert(chunk, { count: 'exact' });
    if (error) {
      console.error(`  ! Chunk ${i / 100 + 1} failed: ${error.message}`);
    } else {
      inserted += c ?? chunk.length;
      console.log(`  ${Math.min(i + 100, rows.length)}/500...`);
    }
  }

  console.log(`\n✅ ${inserted} registrants seeded for Liberia tenant.`);
  await writeSeedAudit(admin, 'civis_registrants', inserted, 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
