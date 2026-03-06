// ── DEMO DATA — synced with DynamoDB (20 vendors, 3 fraud clusters) ──
// The frontend reads from this for VendorSearch + Dashboard display.
// The Analytics page "Run Live AI Scan" calls the real API Gateway instead.
export const API_URL = import.meta.env.VITE_API_URL || null;

export const DEMO_VENDORS = [
    // ── CLUSTER 1: Kanpur Medical (UP Health Ministry) ──────────────────
    {
        vendor_id: 'C001', vendor_name: 'Kanpur MediTech Pvt Ltd',
        score: 90, risk_level: 'HIGH',
        flags: ['FLAG_NEW_COMPANY', 'FLAG_SHARED_ADDRESS', 'FLAG_SHARED_DIRECTOR', 'FLAG_POLITICAL_LINK', 'FLAG_CONTRACT_SPLITTING'],
        address: '14-A Civil Lines, Kanpur UP 208001',
        registration_date: '2022-01-10', paid_up_capital: 500000, contract_total: 6800000,
        state: 'Uttar Pradesh', ministry: 'Health & Family Welfare',
    },
    {
        vendor_id: 'C002', vendor_name: 'UP Surgical Supplies Pvt Ltd',
        score: 95, risk_level: 'HIGH',
        flags: ['FLAG_SHARED_ADDRESS', 'FLAG_SHARED_DIRECTOR', 'FLAG_POLITICAL_LINK', 'FLAG_CAPITAL_MISMATCH', 'FLAG_CONTRACT_SPLITTING'],
        address: '14-A Civil Lines, Kanpur UP 208001',
        registration_date: '2022-02-18', paid_up_capital: 400000, contract_total: 5200000,
        state: 'Uttar Pradesh', ministry: 'Health & Family Welfare',
    },
    {
        vendor_id: 'C003', vendor_name: 'NorthMed Equipments Pvt Ltd',
        score: 75, risk_level: 'HIGH',
        flags: ['FLAG_SHARED_ADDRESS', 'FLAG_POLITICAL_LINK', 'FLAG_CAPITAL_MISMATCH', 'FLAG_CONTRACT_SPLITTING'],
        address: '14-A Civil Lines, Kanpur UP 208001',
        registration_date: '2022-03-05', paid_up_capital: 300000, contract_total: 4100000,
        state: 'Uttar Pradesh', ministry: 'Health & Family Welfare',
    },
    {
        vendor_id: 'C004', vendor_name: 'BharatCare Instruments Pvt Ltd',
        score: 80, risk_level: 'HIGH',
        flags: ['FLAG_SHARED_ADDRESS', 'FLAG_SHARED_DIRECTOR', 'FLAG_CAPITAL_MISMATCH', 'FLAG_CONTRACT_SPLITTING'],
        address: '14-A Civil Lines, Kanpur UP 208001',
        registration_date: '2022-04-22', paid_up_capital: 600000, contract_total: 7300000,
        state: 'Uttar Pradesh', ministry: 'Health & Family Welfare',
    },
    {
        vendor_id: 'C005', vendor_name: 'MedServ India Pvt Ltd',
        score: 75, risk_level: 'HIGH',
        flags: ['FLAG_SHARED_ADDRESS', 'FLAG_POLITICAL_LINK', 'FLAG_CAPITAL_MISMATCH', 'FLAG_CONTRACT_SPLITTING'],
        address: '14-A Civil Lines, Kanpur UP 208001',
        registration_date: '2022-05-14', paid_up_capital: 350000, contract_total: 5900000,
        state: 'Uttar Pradesh', ministry: 'Health & Family Welfare',
    },
    {
        vendor_id: 'C006', vendor_name: 'HealthFirst Solutions Pvt Ltd',
        score: 70, risk_level: 'HIGH',
        flags: ['FLAG_SHARED_ADDRESS', 'FLAG_POLITICAL_LINK', 'FLAG_CAPITAL_MISMATCH', 'FLAG_CONTRACT_SPLITTING'],
        address: '14-A Civil Lines, Kanpur UP 208001',
        registration_date: '2022-08-30', paid_up_capital: 450000, contract_total: 2700000,
        state: 'Uttar Pradesh', ministry: 'Health & Family Welfare',
    },
    // ── CLUSTER 2: Jaipur Infra (Rajasthan PWD) ──────────────────────────
    {
        vendor_id: 'C009', vendor_name: 'Jaipur Infra Build Pvt Ltd',
        score: 92, risk_level: 'HIGH',
        flags: ['FLAG_NEW_COMPANY', 'FLAG_SHARED_ADDRESS', 'FLAG_SHARED_DIRECTOR', 'FLAG_POLITICAL_LINK', 'FLAG_CAPITAL_MISMATCH', 'FLAG_CONTRACT_SPLITTING'],
        address: '88-C MI Road, Jaipur RJ 302001',
        registration_date: '2022-06-01', paid_up_capital: 200000, contract_total: 4500000,
        state: 'Rajasthan', ministry: 'Public Works',
    },
    {
        vendor_id: 'C010', vendor_name: 'Rajasthan Roads Pvt Ltd',
        score: 85, risk_level: 'HIGH',
        flags: ['FLAG_NEW_COMPANY', 'FLAG_SHARED_ADDRESS', 'FLAG_SHARED_DIRECTOR', 'FLAG_CAPITAL_MISMATCH', 'FLAG_CONTRACT_SPLITTING'],
        address: '88-C MI Road, Jaipur RJ 302001',
        registration_date: '2022-06-15', paid_up_capital: 250000, contract_total: 8200000,
        state: 'Rajasthan', ministry: 'Public Works',
    },
    {
        vendor_id: 'C011', vendor_name: 'Desert Construction Co Pvt Ltd',
        score: 80, risk_level: 'HIGH',
        flags: ['FLAG_NEW_COMPANY', 'FLAG_SHARED_ADDRESS', 'FLAG_SHARED_DIRECTOR', 'FLAG_CAPITAL_MISMATCH', 'FLAG_CONTRACT_SPLITTING'],
        address: '88-C MI Road, Jaipur RJ 302001',
        registration_date: '2022-07-03', paid_up_capital: 180000, contract_total: 6700000,
        state: 'Rajasthan', ministry: 'Public Works',
    },
    {
        vendor_id: 'C012', vendor_name: 'Pink City Contractors Pvt Ltd',
        score: 85, risk_level: 'HIGH',
        flags: ['FLAG_NEW_COMPANY', 'FLAG_SHARED_ADDRESS', 'FLAG_SHARED_DIRECTOR', 'FLAG_POLITICAL_LINK', 'FLAG_CAPITAL_MISMATCH', 'FLAG_CONTRACT_SPLITTING'],
        address: '88-C MI Road, Jaipur RJ 302001',
        registration_date: '2022-07-20', paid_up_capital: 220000, contract_total: 3100000,
        state: 'Rajasthan', ministry: 'Public Works',
    },
    // ── CLUSTER 3: Chennai IT (TN e-Gov) ─────────────────────────────────
    {
        vendor_id: 'C014', vendor_name: 'TN Data Systems Pvt Ltd',
        score: 88, risk_level: 'HIGH',
        flags: ['FLAG_NEW_COMPANY', 'FLAG_SHARED_ADDRESS', 'FLAG_SHARED_DIRECTOR', 'FLAG_POLITICAL_LINK', 'FLAG_CAPITAL_MISMATCH', 'FLAG_CONTRACT_SPLITTING'],
        address: '12-D Anna Salai, Chennai TN 600002',
        registration_date: '2023-01-05', paid_up_capital: 150000, contract_total: 2800000,
        state: 'Tamil Nadu', ministry: 'Electronics & IT',
    },
    {
        vendor_id: 'C015', vendor_name: 'SouthTech Analytics Pvt Ltd',
        score: 83, risk_level: 'HIGH',
        flags: ['FLAG_NEW_COMPANY', 'FLAG_SHARED_ADDRESS', 'FLAG_SHARED_DIRECTOR', 'FLAG_POLITICAL_LINK', 'FLAG_CAPITAL_MISMATCH', 'FLAG_CONTRACT_SPLITTING'],
        address: '12-D Anna Salai, Chennai TN 600002',
        registration_date: '2023-01-20', paid_up_capital: 180000, contract_total: 3200000,
        state: 'Tamil Nadu', ministry: 'Electronics & IT',
    },
    {
        vendor_id: 'C016', vendor_name: 'Madurai Software Hub Pvt Ltd',
        score: 78, risk_level: 'HIGH',
        flags: ['FLAG_NEW_COMPANY', 'FLAG_SHARED_ADDRESS', 'FLAG_POLITICAL_LINK', 'FLAG_CAPITAL_MISMATCH', 'FLAG_CONTRACT_SPLITTING'],
        address: '12-D Anna Salai, Chennai TN 600002',
        registration_date: '2023-02-10', paid_up_capital: 160000, contract_total: 2500000,
        state: 'Tamil Nadu', ministry: 'Electronics & IT',
    },
    // ── CLEAN VENDORS (control group) ────────────────────────────────────
    {
        vendor_id: 'C007', vendor_name: 'Delhi Pharma Distributors Ltd',
        score: 10, risk_level: 'LOW', flags: [],
        address: '22-B Connaught Place, New Delhi 110001',
        registration_date: '2019-06-15', paid_up_capital: 5000000, contract_total: 15000000,
        state: 'Delhi', ministry: 'Pharmaceuticals',
    },
    {
        vendor_id: 'C008', vendor_name: 'Mumbai Medical Corp',
        score: 5, risk_level: 'LOW', flags: [],
        address: 'Bandra Kurla Complex, Mumbai 400051',
        registration_date: '2018-03-20', paid_up_capital: 8000000, contract_total: 22000000,
        state: 'Maharashtra', ministry: 'Health & Family Welfare',
    },
    {
        vendor_id: 'C013', vendor_name: 'Chennai IT Solutions Pvt Ltd',
        score: 15, risk_level: 'LOW', flags: ['FLAG_MINISTRY_LOCK'],
        address: '12-D Anna Salai, Chennai TN 600002',
        registration_date: '2021-01-10', paid_up_capital: 2000000, contract_total: 18000000,
        state: 'Tamil Nadu', ministry: 'Electronics & IT',
    },
    {
        vendor_id: 'C017', vendor_name: 'Bengaluru Cloud Infra Ltd',
        score: 8, risk_level: 'LOW', flags: [],
        address: 'Outer Ring Road, Bengaluru KA 560103',
        registration_date: '2017-08-12', paid_up_capital: 15000000, contract_total: 45000000,
        state: 'Karnataka', ministry: 'Electronics & IT',
    },
    {
        vendor_id: 'C018', vendor_name: 'Hyderabad Pharma Exports Ltd',
        score: 5, risk_level: 'LOW', flags: [],
        address: 'Hitech City, Hyderabad TS 500081',
        registration_date: '2016-04-30', paid_up_capital: 20000000, contract_total: 38000000,
        state: 'Telangana', ministry: 'Pharmaceuticals',
    },
    {
        vendor_id: 'C019', vendor_name: 'Pune Agri Supplies Pvt Ltd',
        score: 12, risk_level: 'LOW', flags: [],
        address: 'Koregaon Park, Pune MH 411001',
        registration_date: '2020-11-15', paid_up_capital: 3000000, contract_total: 12000000,
        state: 'Maharashtra', ministry: 'Agriculture',
    },
    {
        vendor_id: 'C020', vendor_name: 'Kolkata Textile Mills Ltd',
        score: 8, risk_level: 'LOW', flags: [],
        address: 'Park Street, Kolkata WB 700016',
        registration_date: '2015-09-25', paid_up_capital: 12000000, contract_total: 9500000,
        state: 'West Bengal', ministry: 'Textiles',
    },
];

export const FLAG_META = {
    FLAG_NEW_COMPANY: {
        label: 'New Company',
        description: 'Registered <90 days before first government contract win',
        weight: 20,
    },
    FLAG_SHARED_ADDRESS: {
        label: 'Shared Address',
        description: 'Registered address shared with other contract-winning vendors at same location',
        weight: 20,
    },
    FLAG_SHARED_DIRECTOR: {
        label: 'Shared Director',
        description: 'Director also sits on board of a competing vendor company',
        weight: 25,
    },
    FLAG_POLITICAL_LINK: {
        label: 'Political Link',
        description: 'Director is a politician or declared family member of an elected official (MyNeta affidavit)',
        weight: 25,
    },
    FLAG_CAPITAL_MISMATCH: {
        label: 'Capital Mismatch',
        description: 'Total contracts exceed 30× the company\'s paid-up capital',
        weight: 10,
    },
    FLAG_CONTRACT_SPLITTING: {
        label: 'Bid Splitting',
        description: 'Multiple contracts awarded to same vendor within 90 days — possible threshold evasion',
        weight: 15,
    },
    FLAG_MINISTRY_LOCK: {
        label: 'Ministry Capture',
        description: '100% of contracts from a single ministry — indicates captured procurement relationship',
        weight: 10,
    },
};

export const DEMO_NARRATIONS = {
    C001: 'Kanpur MediTech Pvt Ltd was incorporated on 10 January 2022 and awarded its first government contract just 67 days later — well below the 90-day shell company threshold. The firm shares its address at 14-A Civil Lines, Kanpur with five other vendors who collectively won ₹3.2 Cr from UP Health Department in a single procurement cycle. Director Rajesh Kumar Verma (DIN: 00112233) sits on 3 of these competing boards, a classic bid-rigging pattern. Six contracts were awarded within 90 days — a bid-splitting indicator. Tender Trace risk score: 90/100 — Refer to UP Vigilance Establishment immediately.',
    C002: 'UP Surgical Supplies Pvt Ltd scores 95/100 — the highest in the dataset. Director Sunita Agarwal is the declared spouse of MLA Mahendra Verma (SP, Kanpur Cantonment) per MyNeta affidavits, creating a direct conflict of interest. The company shares its address with 5 competitors and received ₹52L in cluster contracts. Paid-up capital of ₹4L against ₹52L contracts = 13× ratio. Refer to CBI/ED alongside full Kanpur cluster.',
    C003: 'NorthMed Equipments Pvt Ltd is part of the Kanpur Medical cluster (6 vendors, 1 address). Director Sunita Agarwal\'s political link to MLA Mahendra Verma (SP) applies to this entity. Capital mismatch: ₹3L capital vs ₹41L contracts (13.7×). Bid splitting: 6 contracts awarded within 90 days across the cluster. Score: 75/100.',
    C004: 'BharatCare Instruments Pvt Ltd — Director Rajesh Kumar Verma (DIN: 00112233) sits on 3 competing vendor boards within the same Kanpur cluster. Capital: ₹6L vs contracts: ₹73L (12.2×). 4 contracts awarded within 90 days to cluster members sharing this director. Score: 80/100 — Include in cluster referral.',
    C005: 'MedServ India Pvt Ltd participates in the 6-vendor Kanpur cluster. Director Sunita Agarwal is declared spouse of sitting MLA. ₹35L capital vs ₹59L contracts (16.9×). Score: 75/100.',
    C006: 'HealthFirst Solutions Pvt Ltd is the 6th member of the Kanpur cluster. ₹45L capital vs ₹27L contracts. Political link via Director Sunita Agarwal → MLA Mahendra Verma. Score: 70/100 — Include in cluster referral.',
    C009: 'Jaipur Infra Build Pvt Ltd was registered on 1 June 2022 and awarded a PWD contract just 44 days later. Director Anand Gupta is the son of BJP MLA Devendra Rathore (Jaipur Rural). Shares address at 88-C MI Road with 3 other contractors. Capital ₹2L vs contracts ₹45L (22.5×). Score: 92/100 — Refer to Rajasthan Anti-Corruption Bureau.',
    C010: 'Rajasthan Roads Pvt Ltd — registered 15 June 2022, first contract 47 days later. Director Rohit Joshi is declared nephew of MLA Devendra Rathore. Shares address and director with Jaipur Infra Build. ₹82L contracts vs ₹2.5L capital (32.8× — above threshold). Score: 85/100.',
    C011: 'Desert Construction Co Pvt Ltd — registered 3 July 2022, contract on 20 Aug 2022 (48 days). Director overlap with C009 and C010 (Rohit Joshi). Capital ₹1.8L vs ₹67L contracts (37.2×). Score: 80/100.',
    C012: 'Pink City Contractors Pvt Ltd completes the Jaipur cluster. Directors Anand Gupta and Kavita Sharma both appear on multiple cluster companies. MLA Rathore political link applies. ₹2.2L capital vs ₹31L contracts. Score: 85/100.',
    C013: 'Chennai IT Solutions Pvt Ltd is an established vendor (2021) with ₹20L capital. Has a Ministry Capture flag (100% of contracts from Electronics & IT ministry — long-term relationship worth ₹1.8 Cr). No political links or shared directors detected. Score: 15/100 — Low risk but monitor ministry concentration.',
    C014: 'TN Data Systems Pvt Ltd — registered 5 January 2023, first TN e-Gov contract on 10 March 2023 (64 days). Director Meena Krishnan is the declared spouse of DMK MLA Selvam Murugan (Chennai South). Shares address at Anna Salai with 2 other vendors. Capital ₹1.5L vs ₹28L contracts (18.7×). Score: 88/100 — Refer to Tamil Nadu Vigilance Commission.',
    C015: 'SouthTech Analytics Pvt Ltd — registered 20 Jan 2023, contract 25 March 2023 (64 days). Director Meena Krishnan (political link to DMK MLA). Shares address and director with TN Data Systems. Capital ₹1.8L vs ₹32L contracts (17.8×). Score: 83/100.',
    C016: 'Madurai Software Hub Pvt Ltd — filed in Feb 2023, contract in April 2023 (61 days). Political link: Meena Krishnan → DMK MLA Selvam Murugan. Part of Anna Salai cluster. Score: 78/100.',
    C007: 'Delhi Pharma Distributors Ltd — incorporated 2019, first contract 2021. ₹5Cr capital, ₹1.5Cr contract (0.3× ratio). No shared addresses, director overlaps, or political links detected. Tender Trace risk score: 10/100 — Clean vendor, no action required.',
    C008: 'Mumbai Medical Corp — established 2018, ₹80L capital, ₹2.2Cr contracts (2.75×). No flags. Score: 5/100 — Clean.',
    C017: 'Bengaluru Cloud Infra Ltd — 2017 incorporation, ₹1.5Cr capital, ₹4.5Cr Karnataka KSDC contract. Well-capitalised, long track record, no overlapping directors or political links. Score: 8/100 — Clean.',
    C018: 'Hyderabad Pharma Exports Ltd — 2016 incorporation, ₹2Cr capital. NPPA contract worth ₹3.8Cr. No flags. Score: 5/100 — Clean.',
    C019: 'Pune Agri Supplies Pvt Ltd — 2020 incorporation, ₹30L capital vs ₹1.2Cr contract (4×). Below mismatch threshold. No political / director links. Score: 12/100 — Clean.',
    C020: 'Kolkata Textile Mills Ltd — 2015 incorporation, ₹1.2Cr capital, ₹95L contract (below 1× of capital). Established exporter with long track record. Score: 8/100 — Clean.',
    DEFAULT: 'This vendor has been flagged by Tender Trace based on cross-referencing MCA21 company registration data, MyNeta politician affidavit records, and government procurement contract data stored in Amazon DynamoDB. The flags detected indicate procurement patterns that warrant further scrutiny by the relevant vigilance authority.',
};

// ── VENDOR SEARCH (demo mode; Analytics uses live API) ─────────────
export async function fetchVendorRisk(vendorIdOrName) {
    if (API_URL) {
        const res = await fetch(`${API_URL}/vendor?id=${vendorIdOrName}`);
        if (!res.ok) return { error: `API error ${res.status}` };
        return res.json();
    }
    const q = vendorIdOrName.trim().toUpperCase();
    const vendor = DEMO_VENDORS.find(
        v => v.vendor_id.toUpperCase() === q ||
            v.vendor_name.toLowerCase().includes(q.toLowerCase())
    );
    if (!vendor) return { error: `No vendor found matching "${vendorIdOrName}" — try C001–C020` };
    return {
        ...vendor,
        registration_date: vendor.registration_date,
        narration: DEMO_NARRATIONS[vendor.vendor_id] || DEMO_NARRATIONS.DEFAULT,
    };
}
