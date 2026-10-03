/* Markets for provider signup (pages/join.html): every country, plus local rules where we have them.
   - COUNTRIES: all countries with dialling code (flag emoji is built from the ISO code).
   - PROFILES: country-specific details — phone format, national sign-in, ID document, licence names,
     licence issuers and suggested cities / areas. Countries without a profile use GENERIC wording.
   Add a market by adding a profile; nothing in the page script needs to change. */
(function () {
  const RAW = 'AF|Afghanistan|93;AL|Albania|355;DZ|Algeria|213;AD|Andorra|376;AO|Angola|244;AG|Antigua and Barbuda|1;AR|Argentina|54;AM|Armenia|374;AU|Australia|61;AT|Austria|43;AZ|Azerbaijan|994;BS|Bahamas|1;BH|Bahrain|973;BD|Bangladesh|880;BB|Barbados|1;BY|Belarus|375;BE|Belgium|32;BZ|Belize|501;BJ|Benin|229;BT|Bhutan|975;BO|Bolivia|591;BA|Bosnia and Herzegovina|387;BW|Botswana|267;BR|Brazil|55;BN|Brunei|673;BG|Bulgaria|359;BF|Burkina Faso|226;BI|Burundi|257;KH|Cambodia|855;CM|Cameroon|237;CA|Canada|1;CV|Cape Verde|238;CF|Central African Republic|236;TD|Chad|235;CL|Chile|56;CN|China|86;CO|Colombia|57;KM|Comoros|269;CG|Congo|242;CD|Congo (DRC)|243;CR|Costa Rica|506;CI|Côte d’Ivoire|225;HR|Croatia|385;CU|Cuba|53;CY|Cyprus|357;CZ|Czechia|420;DK|Denmark|45;DJ|Djibouti|253;DM|Dominica|1;DO|Dominican Republic|1;EC|Ecuador|593;EG|Egypt|20;SV|El Salvador|503;GQ|Equatorial Guinea|240;ER|Eritrea|291;EE|Estonia|372;SZ|Eswatini|268;ET|Ethiopia|251;FJ|Fiji|679;FI|Finland|358;FR|France|33;GA|Gabon|241;GM|Gambia|220;GE|Georgia|995;DE|Germany|49;GH|Ghana|233;GR|Greece|30;GD|Grenada|1;GT|Guatemala|502;GN|Guinea|224;GW|Guinea-Bissau|245;GY|Guyana|592;HT|Haiti|509;HN|Honduras|504;HK|Hong Kong|852;HU|Hungary|36;IS|Iceland|354;IN|India|91;ID|Indonesia|62;IR|Iran|98;IQ|Iraq|964;IE|Ireland|353;IL|Israel|972;IT|Italy|39;JM|Jamaica|1;JP|Japan|81;JO|Jordan|962;KZ|Kazakhstan|7;KE|Kenya|254;KI|Kiribati|686;KW|Kuwait|965;KG|Kyrgyzstan|996;LA|Laos|856;LV|Latvia|371;LB|Lebanon|961;LS|Lesotho|266;LR|Liberia|231;LY|Libya|218;LI|Liechtenstein|423;LT|Lithuania|370;LU|Luxembourg|352;MO|Macao|853;MG|Madagascar|261;MW|Malawi|265;MY|Malaysia|60;MV|Maldives|960;ML|Mali|223;MT|Malta|356;MH|Marshall Islands|692;MR|Mauritania|222;MU|Mauritius|230;MX|Mexico|52;FM|Micronesia|691;MD|Moldova|373;MC|Monaco|377;MN|Mongolia|976;ME|Montenegro|382;MA|Morocco|212;MZ|Mozambique|258;MM|Myanmar|95;NA|Namibia|264;NR|Nauru|674;NP|Nepal|977;NL|Netherlands|31;NZ|New Zealand|64;NI|Nicaragua|505;NE|Niger|227;NG|Nigeria|234;KP|North Korea|850;MK|North Macedonia|389;NO|Norway|47;OM|Oman|968;PK|Pakistan|92;PW|Palau|680;PS|Palestine|970;PA|Panama|507;PG|Papua New Guinea|675;PY|Paraguay|595;PE|Peru|51;PH|Philippines|63;PL|Poland|48;PT|Portugal|351;PR|Puerto Rico|1;QA|Qatar|974;RO|Romania|40;RU|Russia|7;RW|Rwanda|250;KN|Saint Kitts and Nevis|1;LC|Saint Lucia|1;VC|Saint Vincent and the Grenadines|1;WS|Samoa|685;SM|San Marino|378;ST|São Tomé and Príncipe|239;SA|Saudi Arabia|966;SN|Senegal|221;RS|Serbia|381;SC|Seychelles|248;SL|Sierra Leone|232;SG|Singapore|65;SK|Slovakia|421;SI|Slovenia|386;SB|Solomon Islands|677;SO|Somalia|252;ZA|South Africa|27;KR|South Korea|82;SS|South Sudan|211;ES|Spain|34;LK|Sri Lanka|94;SD|Sudan|249;SR|Suriname|597;SE|Sweden|46;CH|Switzerland|41;SY|Syria|963;TW|Taiwan|886;TJ|Tajikistan|992;TZ|Tanzania|255;TH|Thailand|66;TL|Timor-Leste|670;TG|Togo|228;TO|Tonga|676;TT|Trinidad and Tobago|1;TN|Tunisia|216;TR|Türkiye|90;TM|Turkmenistan|993;TV|Tuvalu|688;UG|Uganda|256;UA|Ukraine|380;AE|United Arab Emirates|971;GB|United Kingdom|44;US|United States|1;UY|Uruguay|598;UZ|Uzbekistan|998;VU|Vanuatu|678;VA|Vatican City|39;VE|Venezuela|58;VN|Vietnam|84;YE|Yemen|967;ZM|Zambia|260;ZW|Zimbabwe|263';
  const flag = iso => String.fromCodePoint(...[...iso].map(c => 127397 + c.charCodeAt(0)));
  const COUNTRIES = RAW.split(';').map(x => { const [iso, name, dial] = x.split('|'); return { iso, name, dial: '+' + dial, flag: flag(iso) }; });

  /* licence keys used by the signup page:
     agentCard / agentNo  — individual agent licence (+ its number field)
     office / officeNo    — agency / brokerage registration
     company / companyNo  — business registration for any company (+ issuers in `authorities`)
     ownership            — proof the owner may let the property
     shortStay, tour, education, insurance, health, freelance — sector licences
     a licence set to null is not asked for; [label, hint, required] */
  const GENERIC = {
    phone: { example: 'Mobile number', pattern: '^\\d{6,14}$', groups: [3, 3, 4] },
    signIn: null,
    idDoc: 'Government ID or passport',
    emailExample: 'you@company.com',
    licences: {
      agentCard: ['Real estate agent licence', 'Your professional licence or registration, if your country issues one', false], agentNo: 'Licence / registration no. (if any)',
      office: ['Agency registration', 'Business registration of the agency', true], officeNo: 'Registration no.',
      company: ['Business registration', 'Certificate of registration or trade licence', true], companyNo: 'Registration no.',
      authorities: null,
      ownership: ['Proof of ownership', 'Title deed, land registry extract or tax bill — checked, never shown', true],
      shortStay: ['Short-stay licence', 'If your city requires one for holiday rentals', false],
      tour: ['Tour operator licence', 'If your country requires one', false],
      education: ['Education licence', 'School or training-centre registration, if required', false],
      insurance: ['Insurance licence', 'Issued by your insurance regulator', true],
      health: ['Healthcare licence', 'For clinics and practitioners', false],
      freelance: ['Self-employment registration', 'Tax or freelance registration', false]
    },
    cities: {}
  };

  const PROFILES = {
    AE: {
      phone: { example: '50 123 4567', pattern: '^5\\d{8}$', groups: [2, 3, 4] },
      signIn: { label: 'UAE PASS', badge: 'UAE', hint: 'Fastest — verifies your name and mobile in one step' },
      idDoc: 'Emirates ID', emailExample: 'you@company.ae',
      licences: {
        agentCard: ['RERA broker card', 'Shows your BRN · issued by Dubai Land Department', true], agentNo: 'RERA BRN', agentNoPattern: '^\\d{4,6}$',
        office: ['RERA office registration (ORN)', 'Office registration certificate from DLD', true], officeNo: 'RERA ORN',
        company: ['Trade licence', 'Valid DED, DET or free-zone licence', true], companyNo: 'Trade licence no.',
        authorities: ['Dubai DET (mainland)', 'DMCC', 'Dubai South', 'DIFC', 'Dubai Silicon Oasis', 'Abu Dhabi ADDED', 'Sharjah SEDD', 'Other free zone'],
        ownership: ['Title deed', 'Or Oqood for off-plan — we check ownership, it is never shown', true],
        shortStay: ['DTCM holiday home permit', 'Holiday home operator licence', true],
        tour: ['DTCM tour operator licence', 'Required for tours, safaris and activities', true],
        education: ['KHDA permit', 'For schools, training centres and courses', true],
        insurance: ['CBUAE licence', 'Central Bank of the UAE insurer / broker licence', true],
        health: ['DHA licence', 'Dubai Health Authority licence for clinics and practitioners', false],
        freelance: ['Freelance permit', 'Issued by your free zone or the DED', true]
      },
      cities: {
        'Dubai': (window.UP ? UP.AREAS.map(a => a.n) : []),
        'Abu Dhabi': ['Al Reem Island', 'Saadiyat Island', 'Yas Island', 'Al Raha Beach', 'Khalifa City', 'Al Khalidiyah', 'Corniche', 'Al Reef', 'Mussafah'],
        'Sharjah': ['Al Majaz', 'Al Nahda', 'Al Khan', 'Muwaileh', 'Aljada', 'Al Taawun'],
        'Ajman': ['Al Nuaimiya', 'Al Rashidiya', 'Emirates City'], 'Ras Al Khaimah': ['Al Hamra', 'Mina Al Arab', 'Al Nakheel']
      }
    },
    SA: {
      phone: { example: '50 123 4567', pattern: '^5\\d{8}$', groups: [2, 3, 4] },
      signIn: { label: 'Nafath', badge: 'KSA', hint: 'Verify your identity with the national single sign-on' },
      idDoc: 'National ID or Iqama', emailExample: 'you@company.sa',
      licences: {
        agentCard: ['REGA FAL licence', 'Real Estate General Authority broker licence', true], agentNo: 'FAL licence no.',
        office: ['REGA FAL licence (company)', 'Brokerage licence of the office', true], officeNo: 'FAL licence no.',
        company: ['Commercial Registration (CR)', 'Valid CR certificate', true], companyNo: 'CR number',
        authorities: ['Ministry of Commerce', 'MISA (foreign investment)'],
        ownership: ['Title deed (sak)', 'Electronic title deed — checked, never shown', true],
        shortStay: ['Ministry of Tourism licence', 'Required for holiday rentals', true],
        tour: ['Ministry of Tourism licence', 'Required for tours and activities', true],
        education: ['Ministry of Education licence', 'For schools and training centres', true],
        insurance: ['Insurance Authority licence', 'Insurer or broker licence', true],
        health: ['Ministry of Health licence', 'For clinics and practitioners', false],
        freelance: ['Freelance document', 'Issued through the national freelance platform', true]
      },
      cities: {
        'Riyadh': ['Olaya', 'Al Malqa', 'Hittin', 'KAFD', 'Al Yasmin', 'Al Narjis', 'Diplomatic Quarter', 'Al Sahafa'],
        'Jeddah': ['Al Shati', 'Al Rawdah', 'Obhur', 'Al Zahra', 'Al Hamra', 'Al Salamah'],
        'Dammam': ['Al Shati', 'Al Faisaliyah', 'Al Mazruiyah'], 'Khobar': ['Al Ulaya', 'Al Rakah', 'Corniche']
      }
    },
    GB: {
      phone: { example: '7700 900123', pattern: '^7\\d{9}$', groups: [4, 6] },
      signIn: null, idDoc: 'Passport or UK driving licence', emailExample: 'you@company.co.uk',
      licences: {
        agentCard: ['Redress scheme membership', 'The Property Ombudsman or Property Redress Scheme', true], agentNo: 'Membership no.',
        office: ['Redress scheme membership (company)', 'Required for letting and estate agencies', true], officeNo: 'Membership no.',
        company: ['Companies House registration', 'Certificate of incorporation', true], companyNo: 'Company number',
        authorities: ['Companies House (limited company)', 'HMRC (sole trader)', 'Partnership / LLP'],
        ownership: ['Proof of ownership', 'HM Land Registry title or council tax bill — checked, never shown', true],
        shortStay: ['Short-let registration', 'If your council requires one (e.g. London 90-night rule)', false],
        tour: null, education: ['Ofsted / DfE registration', 'For schools and childcare', false],
        insurance: ['FCA authorisation', 'Financial Conduct Authority reference', true],
        health: ['CQC registration', 'Care Quality Commission, if applicable', false],
        freelance: ['HMRC self-assessment UTR', 'Your Unique Taxpayer Reference', false]
      },
      cities: {
        'London': ['Canary Wharf', 'Shoreditch', 'Kensington', 'Camden', 'Islington', 'Clapham', 'Battersea', 'Hackney', 'Westminster', 'Greenwich'],
        'Manchester': ['City Centre', 'Ancoats', 'Didsbury', 'Salford Quays', 'Chorlton'], 'Birmingham': ['City Centre', 'Edgbaston', 'Moseley', 'Jewellery Quarter'],
        'Edinburgh': ['New Town', 'Old Town', 'Leith', 'Stockbridge']
      }
    },
    IN: {
      phone: { example: '98765 43210', pattern: '^[6-9]\\d{9}$', groups: [5, 5] },
      signIn: { label: 'DigiLocker', badge: 'IN', hint: 'Share your ID straight from DigiLocker' },
      idDoc: 'Aadhaar or PAN card', emailExample: 'you@company.in',
      licences: {
        agentCard: ['State RERA agent registration', 'Issued by your state RERA', true], agentNo: 'RERA agent reg. no.',
        office: ['State RERA registration (firm)', 'Registration of the brokerage', true], officeNo: 'RERA reg. no.',
        company: ['GST certificate', 'Or company / shop registration', true], companyNo: 'GSTIN',
        authorities: ['MCA (private limited / LLP)', 'Shop & Establishment', 'Partnership firm', 'Sole proprietor'],
        ownership: ['Sale deed or property tax receipt', 'Checked, never shown', true],
        shortStay: ['State tourism registration', 'If your state requires one', false], tour: ['Ministry of Tourism approval', 'If applicable', false],
        education: ['Board recognition / affiliation', 'For schools and coaching centres', false],
        insurance: ['IRDAI licence', 'Insurer or broker licence', true],
        health: ['Clinical establishment registration', 'For clinics and practitioners', false],
        freelance: ['PAN card', 'For tax identification', true]
      },
      cities: {
        'Mumbai': ['Bandra', 'Andheri', 'Powai', 'Lower Parel', 'Worli', 'Juhu', 'Thane'],
        'Bengaluru': ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar', 'Electronic City'],
        'Delhi': ['Connaught Place', 'Saket', 'Vasant Kunj', 'Dwarka', 'Hauz Khas'], 'Gurugram': ['Golf Course Road', 'Cyber City', 'Sohna Road']
      }
    },
    US: {
      phone: { example: '212 555 0147', pattern: '^\\d{10}$', groups: [3, 3, 4] },
      signIn: null, idDoc: 'Driver’s license or passport', emailExample: 'you@company.com',
      licences: {
        agentCard: ['State real estate license', 'Issued by your state real estate commission', true], agentNo: 'License no.',
        office: ['Brokerage license', 'State broker license of the office', true], officeNo: 'Broker license no.',
        company: ['Business registration', 'Articles of organization or business license', true], companyNo: 'EIN',
        authorities: ['LLC', 'Corporation', 'Sole proprietor', 'Partnership'],
        ownership: ['Deed or property tax bill', 'Checked, never shown', true],
        shortStay: ['Short-term rental permit', 'If your city requires one', false], tour: null,
        education: ['State license', 'If required in your state', false],
        insurance: ['State insurance license', 'Producer or company license', true],
        health: ['State health license', 'For clinics and practitioners', false],
        freelance: ['Business license or EIN', 'If you have one', false]
      },
      cities: {
        'New York': ['Manhattan', 'Brooklyn', 'Queens', 'Harlem', 'Upper East Side', 'Williamsburg'],
        'Los Angeles': ['Santa Monica', 'Downtown LA', 'Hollywood', 'Silver Lake', 'Venice'],
        'Miami': ['Brickell', 'Wynwood', 'Miami Beach', 'Coral Gables'], 'Chicago': ['The Loop', 'River North', 'Lincoln Park', 'Wicker Park']
      }
    }
  };

  // full profile for a country: its own rules on top of the generic ones
  const market = iso => {
    const p = PROFILES[iso] || {};
    return { ...GENERIC, ...p, phone: { ...GENERIC.phone, ...(p.phone || {}) }, licences: { ...GENERIC.licences, ...(p.licences || {}) }, cities: p.cities || {} };
  };
  window.MARKETS = { COUNTRIES, PROFILES, GENERIC, market, byIso: iso => COUNTRIES.find(c => c.iso === iso), DEFAULT: 'AE' };
})();
