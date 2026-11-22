/* ============================================================================
 * UAE CAPITALISM LAB  -  BEGINNER HELP, PART 2: FULL COVERAGE
 * Explanations for every card label, column title, section heading, field label,
 * tab and button found on any screen (harvested from all ~2,400 panels).
 * Loaded after help.js; extends UI.HELP_TERMS / UI.HELP_ACT and the lookup rules.
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

Object.assign(UI.HELP_TERMS, {
  /* ---- people & company cards */
  'management': 'Management skill (0–100): how well this person runs firms. Higher = more efficient firms.',
  'marketing': 'Marketing skill / expertise: makes advertising stronger (+1% per point).',
  'finance': 'Finance skill: better at money decisions – loans, shares and investments.',
  'goals achieved': 'How many of the game goals you have completed.',
  'score': 'Your overall game score – grows with company value, wealth, profit and number of firms.',
  'personal net worth': 'Your own wealth (not the company’s): cash + shares + property.',
  'your net worth': 'Your own wealth (not the company’s): cash + shares + property.',
  'firms': 'Number of businesses (shops, factories, offices…) owned.',
  'shareholdings': 'Shares of companies held personally.',
  'loans': 'Money borrowed from banks that must be repaid with interest.',
  'bonds': 'Bonds: IOUs sold to investors – you pay them interest and repay at the end.',
  'credit line left': 'How much more the bank will lend you.',
  'richest ceo': 'The wealthiest CEO in the game right now.',
  /* ---- city & economy */
  'population': 'Number of people living in the city – more people means more customers.',
  'nominal gdp': 'Size of the economy: the value of everything produced in a year (before inflation adjustment).',
  'gdp per capita': 'Economy size per person – a rough measure of how rich residents are.',
  'cpi index': 'Consumer price index: 100 = prices at the start. Above 100 = things got more expensive (inflation).',
  'avg compensation': 'Average monthly pay – higher pay means people can buy more, but your staff cost more.',
  'unemployment': 'Share of people without a job. High unemployment = weaker spending.',
  'unemployment rate': 'Share of people without a job. High unemployment = weaker spending.',
  'tourists / yr': 'Visitors per year – they shop, stay in hotels and visit attractions.',
  'tourists / year': 'Visitors per year – they shop, stay in hotels and visit attractions.',
  'tourists': 'Visitors per year – they shop, stay in hotels and visit attractions.',
  'hotel adr / occ': 'Hotels: average room price per night and share of rooms booked.',
  'modelled firms va': 'Value added by all firms simulated in the game in this city.',
  'uae population (modelled)': 'Total people in all UAE cities in the game.',
  'uae gdp (sum of emirates)': 'Size of the whole UAE economy in the game.',
  'cbuae base rate': 'The central bank interest rate. It sets loan and deposit rates for everyone.',
  'vat / corporate tax': 'UAE taxes: 5% VAT on sales to consumers, 9% tax on company profit above AED 375,000.',
  'aed per usd': 'Exchange rate: the dirham is fixed (pegged) at 3.6725 per US dollar.',
  'oil price index': 'Oil price compared with the start (1.00 = same). Affects fuel, plastics and oil companies.',
  'gold price index': 'Gold price compared with the start. Affects jewellery and gold costs.',
  'consumption / month': 'Money households spend each month.', 'investment / month': 'Money spent on new buildings and equipment each month.',
  'government spending / month': 'What the government spends each month.', 'net exports / month': 'Exports minus imports each month.',
  'inflation y/y': 'How much prices rose over the past year.', 'inflation & interest rate': 'Price rises over time and the interest rate.',
  'purchasing power': 'How much people can buy with their income after prices – higher = stronger shoppers.',
  'market apartment rent': 'Typical yearly rent for a flat in this city.', 'market office rent': 'Typical yearly office rent per m² in this city.',
  'housing affordability': 'How easily residents can afford rent compared with their pay.',
  'benchmark adr': 'Typical hotel room price per night here.', 'benchmark occupancy': 'Typical share of hotel rooms booked here.',
  'season (this month)': 'Tourism season: winter (Nov–Mar) is busy, summer is quiet.', 'modelled hotel occupancy': 'Booked rooms in the game’s hotels.',
  'civic & sports facilities': 'Public buildings, parks and stadiums – they improve quality of life.',
  'qol': 'Quality of life (0–100): how pleasant the city is to live in.', 'gdp/capita': 'Economy size per person.', 'gdp bn': 'Size of the economy in billions of AED.',
  'city markets': 'The cities (markets) in this emirate.', 'emirate': 'One of the seven emirates of the UAE.',
  'salary level': 'Average pay in the city.', 'salary level (avg monthly pay, aed)': 'Average monthly pay in the city.',
  'consumer spending - modelled retail sales / month': 'Money shoppers spend in the game’s shops each month.',
  'modelled exports & imports': 'Goods sold abroad and bought from abroad by the game’s firms.',
  'government income statement': 'What the city government earns (taxes, fees) and spends.', 'government balance sheet': 'What the government owns and owes.',
  'retail sales (modelled stores)': 'Sales in the game’s shops.', 'retail sales per capita': 'Shop sales per resident.',
  'modelled occupancy': 'Share of flats, offices or rooms that are rented.', 'modelled buildings': 'Buildings simulated in this city.',
  'hotel occupancy': 'Share of hotel rooms booked.',
  /* ---- markets & products */
  'modelled sales / day': 'Units sold per day by shops in the game (excluding background shops).',
  'modelled sales/day': 'Units sold per day by shops in the game.',
  'background retailers': 'Share of sales made by ordinary shops that exist in the city but aren’t run by any company in the game.',
  'avg price': 'Average selling price in this city.', 'avg quality': 'Average product quality in this city.', 'avg brand': 'Average brand strength in this city.',
  'rating weights': 'How much customers care about price, quality and brand for this product.',
  'reference price': 'Typical shelf price for this product.', 'ref price': 'Typical shelf price for this product.', 'retail ref': 'Typical shelf price.',
  'import landed (to city centre)': 'Cost to import one unit including shipping, customs and transport.',
  'import price': 'Cost to import one unit.', 'world price': 'International price of this product.',
  'uae production / day': 'How much is made in the UAE each day.', 'uae use / day': 'How much is used in the UAE each day.',
  'balance': 'Supply compared with demand. Shortage = prices rise, surplus = prices fall.',
  'wholesale price': 'Price firms pay each other for this product in the UAE.',
  'your awareness in': 'How many shoppers in this city know your brand (advertising raises it).', 'season': 'Time of year that affects demand (e.g. harvest or tourist season).',
  'your awareness in dubai': 'How many shoppers in Dubai know your brand (advertising raises it).', 'your loyalty': 'How much customers like your brand (good quality and price raise it).',
  'marketing expertise bonus': 'Extra advertising power from your marketing people.',
  'uae demand/day': 'How many units the whole UAE buys per day.', 'sellers': 'How many companies sell this product.', 'leader': 'The company with the biggest share.',
  'product': 'The item being made or sold.', 'class': 'Product category.', 'type': 'Kind of business or product.',
  'output': 'What this firm produces.', 'inputs per unit': 'Raw materials needed to make one unit.', 'inputs': 'Raw materials needed.',
  'units/day per line': 'How many units one production line makes per day.', 'labour+energy': 'Staff and electricity cost per unit.',
  'est. unit cost': 'Estimated cost to make one unit.', 'output/day per level': 'Daily output per building level.', 'variable cost / unit': 'Cost that rises with every unit made.',
  'resource': 'Natural resource (oil, gas, sand…).', 'where (real)': 'Real location in the UAE.', 'extraction cost': 'Cost to dig or pump one unit.',
  'site': 'The natural resource site this firm sits on.', 'reserve left': 'How much is left in the ground.', 'years left at this rate': 'How long until the site runs out.',
  'grade': 'Richness of the deposit – higher grade = more output.', 'ore quality': 'Quality of the raw material from this site.', 'cost ×': 'Extraction cost compared with normal.',
  'demand/day': 'Units customers want per day.', 'modelled supply': 'Units the game’s sellers can supply.', 'supply · demand': 'Yellow bar = what you can supply, orange = what customers want.',
  'units': 'Number of units.', 'retail units/day': 'Units sold in shops per day.', 'retail sales/day': 'Shop sales per day (AED).', 'produced (month)': 'Units made this month.',
  'made (month)': 'Units made this month.', 'sell price': 'Price you charge buyers.', 'input': 'A raw material or part.', 'per unit': 'Amount needed for one unit.',
  'needed / day': 'Amount needed per day at the current rate.', 'in stock': 'Amount you have stored.', 'landed cost': 'Cost delivered to your door.',
  'from firms': 'Share bought from companies (the rest is imported).', 'component': 'Part of a whole.', 'weight': 'How much it counts.',
  'market / day': 'Units the market buys per day.', 'modelled share': 'Share of sales held by the game’s companies.',
  'product class expertise': 'Expertise with a type of product: speeds up research for it (+1% per point).',
  'online market share': 'Share of online buyers choosing you over global vendors.', 'b2b / store sales this month': 'Licences sold to shops, factories and businesses this month.',
  'uae market': 'Number of potential subscribers in the UAE.', 'monthly revenue': 'Money earned per month.', 'runs on your cloud': 'Share of compute coming from your own data centres (cheaper).',
  'members': 'Paying members of your shopping membership.', 'membership revenue': 'Money from membership fees per month.', 'member boost': 'Members buy more often.',
  'subscribers': 'People paying every month.', 'arpu / month': 'Average revenue per user per month.', 'arpu / yr': 'Average revenue per user per year.',
  'active users': 'People using the app or website.', 'gmv / day': 'Value of goods sold through the platform per day (not your revenue).', 'take rate': 'Commission you keep from each sale.',
  'gmv / user / yr': 'Spending per user per year on the platform.', 'model': 'Business model.', 'players': 'Companies in this business.',
  'publishers': 'Software companies making this kind of software.', 'leader revenue / mo': 'Monthly revenue of the market leader.',
  'servers installed': 'AI servers running in this data centre.', 'utilisation': 'Share of servers in use – above 85% the centre adds racks.',
  'rented to customers': 'Servers rented out to other businesses.', 'your own ai use': 'Servers used by your own AI subscribers.', 'server quality': 'Quality of the installed servers.',
  'servers in stock': 'Bought servers waiting to be installed.', 'customers / day': 'Customers served per day.', 'visitors / day': 'Visitors per day.',
  /* ---- stock market */
  'last price': 'The latest price of one share.', 'market cap': 'Share price × number of shares = what the market says the company is worth.',
  'eps ttm': 'Earnings per share: profit over the last 12 months divided by the number of shares.',
  'book / share': 'Accounting value of the company (assets − debts) per share.',
  'fundamental est.': 'The game’s estimate of a fair share price based on profit and assets. Price below it = possibly cheap.',
  'price history': 'How the share price moved over time.', 'trade ticket': 'Buy or sell shares: pick the account (yours or your company’s), the number of shares, then Buy or Sell.',
  'shareholder register': 'Who owns the company’s shares and how much.', 'shares outstanding': 'Total number of shares that exist.',
  'free float': 'Shares anyone can buy on the market.', 'your combined stake': 'Shares held by you and your company together.',
  'holder': 'Owner of shares.', 'shares': 'Number of shares.', 'stake': 'Share of the company owned.', 'since': 'Owned since this date.',
  'company': 'Company name.', 'listing': 'Stock exchange where it trades (or private).', 'hq': 'Headquarters city.', 'sector': 'Type of business.',
  'value': 'What the company is worth.', 'us$': 'Value in US dollars.', 'tag': 'Data source: REAL, EST (estimate) or GAME.',
  'bond': 'A bond (loan you can buy).', 'issuer': 'Who borrowed the money.', 'coupon': 'Yearly interest the bond pays.', 'maturity': 'When the loan is repaid.',
  'ytm': 'Yield to maturity: your yearly return if you hold the bond to the end.', 'trade (face aed)': 'Amount of bonds to buy or sell.',
  'principal': 'Amount borrowed.', 'rate': 'Interest rate.', 'amount': 'Amount of money.', 'ends': 'When it ends.',
  'roe': 'Return on equity: profit compared with the owners’ money. Higher = better.', 'rev growth': 'Revenue growth over a year.', 'tsr 1y': 'Share price change plus dividends over one year.',
  /* ---- firms */
  'firm': 'A business you own.', 'owner': 'Company that owns it.', 'district': 'Area of the city.', 'status': 'Open or under construction.', 'trend': 'Recent direction.',
  'person': 'A person in the game.', 'objective': 'What to achieve.', 'achieved': 'Done or not.', 'candidate': 'Someone you can hire.',
  'mgmt': 'Management skill.', 'tech': 'Technology skill.', 'mkt': 'Marketing skill.', 'fin': 'Finance skill.', 'salary/mo': 'Monthly pay.', 'assign to': 'Pick a firm for this manager.',
  'store': 'A shop.', 'aed': 'UAE dirhams.', 'media': 'Where ads run: TV, radio, newspaper, outdoor or digital.', 'market': 'Market or city.',
  'budget / month': 'Money spent per month.', 'spent': 'Money spent so far.', 'city': 'City.', 'awareness': 'How many people know your brand.',
  'loyalty': 'How much customers like your brand (can be negative).', 'rating': 'Score out of 100.', 'campaigns': 'Advertising campaigns.',
  'lease until': 'When the rental contract ends.', 'building': 'Type of building.', 'industry': 'Business sector.', 'yours': 'What you own.',
  'ceo': 'Chief Executive Officer – runs the company.', 'cmo': 'Chief Marketing Officer – runs advertising.', 'data': 'The data shown.', 'source': 'Where the data comes from.',
  'source of wealth': 'Where the person’s money comes from.', '2025 change': 'How much this changed in 2025.',
  'space occupied': 'Share of the mall’s shop units that are rented.', 'vacant units': 'Empty shop units you can rent out.', 'leasable': 'Space that can be rented.',
  'rooms': 'Hotel rooms.', 'adr': 'Average daily rate: average room price per night.', 'revpar': 'Revenue per available room per night (price × occupancy).',
  'ppa': 'Power purchase agreement: fixed price you get for each kWh of electricity.',
  'customer deposits': 'Money customers keep in your bank (you owe it to them).', 'loan book': 'Money your bank has lent out (earns interest).',
  'market deposit rate': 'Typical interest banks pay savers.', 'market lending rate': 'Typical interest banks charge borrowers.',
  'location': 'Where the store is.', 'production rate': 'How hard the factory runs (0–100%). Lower it if stock piles up.',
  'software title': 'Which software this company makes.', 'online price (incl. vat)': 'Price for online buyers including 5% VAT.',
  'wholesale licence price': 'Price shops, factories and businesses pay you per licence.', 'membership fee': 'Monthly price of your shopping membership.',
  'ticket price': 'Price per visitor.', 'cloud price': 'Monthly rent you charge per server.', 'server target': 'How many servers this data centre should have.',
  'buy servers from': 'Where new servers come from: your server factory (cheapest), another company or import.', 'service type': 'Kind of service sold.',
  'renew only if rent ≤': 'Leave the mall if the landlord raises rent above this level.', 'advertising / month': 'Monthly ad money for this firm (builds brand).',
  'training / month': 'Monthly training money (raises efficiency and quality).', 'manager': 'Person running this firm – a good manager raises output.',
  'research product': 'Which product this R&D centre improves.', 'average daily rate': 'Room price per night.', 'deposit rate %': 'Interest your bank pays savers.',
  'business model': 'How the internet company makes money.', 'graphs': 'Charts of the data over time.',
  'backward integration': 'How much the CEO prefers making inputs yourself instead of buying them.', 'pricing policy': 'Default price level for your products.',
  'purchasing policy': 'Where to buy: own firms first, cheapest, or best quality.', 'advertising budget': 'Share of revenue spent on ads.',
  'spend on one expansion': 'Most cash the CEO may spend on one new firm.', 'adequate cash for expansion': 'Cash the CEO keeps before expanding.',
  'loss months before closing': 'How many losing months before the CEO closes a firm.', 'dividend payout ratio': 'Share of profit paid to shareholders as dividends.',
  'chief marketing officer': 'Runs advertising for the whole company.', 'chief technology officer': 'Runs research and technology.', 'public relations': 'Builds the company image.',
  'human resources': 'Training for all staff.', 'investor relations': 'Keeps investors happy – supports the share price.', 'community engagement': 'Donations that improve life in your HQ city.',
  'account': 'Pay with your own money or your company’s.', 'amount (aed)': 'Amount in dirhams.',
  /* ---- section headings */
  'monthly history': 'Month-by-month figures.', 'income statement': 'What came in (revenue) and went out (costs) – the profit and loss.',
  'balance sheet': 'What the company owns (assets) and owes (debts) right now.', 'cash flow': 'Where cash came from and went.',
  'farms': 'Farming areas in the UAE.', 'natural resources': 'Oil, gas and mineral sites you can buy.', 'natural resource sites': 'Oil, gas and mineral sites you can buy.',
  'current managers': 'People managing your firms.', 'government mode': 'Lets you build public buildings.',
  'fa01': 'Borrow from a bank. You get cash now and pay interest every month.', 'fa11': 'Borrow from investors by issuing bonds for 5 years.',
  'fa12': 'Put spare cash in the bank and earn interest.', 'fa04': 'How much profit to pay to shareholders every quarter.', 'fa13': 'Pay a one-off bonus dividend.',
  'fa05': 'Sell shares to the public and list on the stock exchange – raises lots of cash.', 'fa06/07': 'Create a subsidiary company or add cash to one.',
  'fa16': 'Buy shares in other companies – own more than 50% to take control.', 'fa20': 'Buy a whole private company.',
  'internet business models': 'Ways internet companies earn money.', 'prerequisites & economics': 'What you need and how it makes money.',
  'ceo office': 'Who runs the company and key automatic settings.', 'executive team': 'Your CEO, CMO and CTO and what they do automatically.',
  'departments (monthly budgets, aed)': 'Company-wide budgets for advertising, training, research and more.', 'departments': 'Company-wide budgets.',
  'save slots': 'Places to save your game.', 'file': 'Export your save or accounts.', 'options': 'Game settings.', 'elite people': 'Cheat: maxed skills and top candidates.',
  'add company cash': 'Cheat: add money to your company.', 'backups': 'Automatic copies of your saves you can restore.',
  'sellers in': 'Shops selling this product in the city, with prices and quality.', 'market share by company': 'Who sells the most of this product.',
  'active campaigns': 'Advertising campaigns running now.', 'product brands by city': 'Your brand strength for each product in each city.', 'identity': 'Basic company facts.',
  'bank loans': 'Money borrowed from banks.', 'bonds issued': 'Bonds the company sold to investors.', 'deposits held': 'Money kept in banks.',
  'ai strategy traits': 'Personality of this AI company: how aggressive, risky and price-focused it is.',
  'retail competition in': 'Shops competing for this product in the city.', 'producers & wholesalers': 'Firms making or stocking this product.',
  'producers & wholesalers (uae)': 'Firms making or stocking this product.', 'recipe': 'Inputs needed to make this product.',
  'uae wholesale market (b2b)': 'How firms trade this product with each other in the UAE.', 'production chain': 'From raw materials to finished product.',
  'import route': 'Port and costs for importing.', 'your campaigns': 'Your advertising for this product.', 'new advertising campaign': 'Start an ad campaign: pick media, city, monthly budget and length.',
  'supply & demand by city': 'For each city: what customers want versus what sellers can supply.', 'history': 'Past prices, demand and sales.',
  'shopping mall': 'Mall rating, rents and tenant stores.', 'stores in this mall': 'Shops and cafés renting space here.', 'set up a store in this mall': 'Rent space and open your own shop here.',
  'leasing': 'Rents and occupancy.', 'hotel operations': 'Rooms, prices and bookings.', 'solar farm': 'Electricity output and contract price.', 'bank': 'Deposits, loans and interest rates.',
  'logistics company': 'Transport business.', 'import company': 'Makes your imports cheaper.', 'export company': 'Gets you better export prices.',
  'internet business': 'Users and revenue of your internet company.', 'telecom': 'Mobile subscribers and monthly revenue.', 'headquarters': 'Your company’s main office.',
  'product lines (purchasing → sales)': 'What this shop sells: where it buys, the price, stock and sales.', 'store location': 'Customer traffic and popularity of this location.',
  'product ratings vs city average': 'How your products compare with competitors on price, quality and brand.', 'stocked products (wholesale)': 'Products this warehouse imports and supplies.',
  'production': 'What this firm produces and at what cost.', 'natural resource site': 'The deposit this firm extracts from.',
  'manufacturing': 'Production lines: product, raw materials, costs and sales.', 'raw materials & components (purchasing)': 'Inputs for this product and where they come from.',
  'software development': 'Your software title, versions and research.', 'sales': 'How much is sold.', 'subscription plan': 'Monthly subscribers, price and revenue.',
  'online store catalogue': 'Products your online store sells across the UAE.', 'membership (prime-style subscription)': 'Paid shopping membership: fee, members and revenue.',
  'attraction / sports': 'Ticket price and visitors.', 'cloud data centre': 'Servers, cloud rental and utilisation.', 'service': 'Service type, price and customers.',
  'research & development': 'Raise technology for a product with research projects.', 'expertise': 'Experience in each industry: every 20 points = +1 unit level for firms this person runs.',
  'delegation': 'Let the CEO run the company for you.', 'expansion strategies': 'Which kinds of business the CEO may build.', 'scope of production': 'Which product types the company may make or sell.',
  'management policies': 'Rules the CEO follows for prices, buying and budgets.', 'product pricing overrides': 'Special price levels for single products.', 'financial policy': 'Loans, dividends and cash rules.',
  'hire': 'Appoint this person to a job.', 'retail & services': 'Shops, restaurants, malls, hotels and attractions.', 'industry & resources': 'Factories, farms, mines and oil wells.',
  'real estate': 'Apartments, offices and mansions to rent out.', 'media & digital': 'TV, radio, software, internet, telecom, data centres and R&D.',
  'banking & insurance': 'Banks and insurance companies.', 'trade & logistics': 'Import, export and transport companies.', 'corporate & civic': 'Headquarters and public buildings.',
  'dubai real gdp by industry': 'How big each industry is in Dubai’s economy.', 'dubai cpi basket': 'What prices are measured in inflation and how they changed.',
  'consumer markets in': 'The biggest products shoppers buy in this city.', 'tourists / year ': 'Visitors per year.',
  /* ---- tabs */
  'all': 'Show everything.', 'listed': 'Companies on a stock exchange.', 'private / state': 'Companies not on a stock exchange.', 'real uae': 'Real UAE companies.',
  'ai start-ups': 'Fictional companies run by the computer.', 'mine': 'Only yours.', 'my companies': 'Only your companies.', 'competitors': 'Other companies.',
  'all cities': 'Every city.', 'month to date': 'From the 1st of this month until today.', 'last month': 'The previous full month.', 'year to date': 'From 1 January until today.',
  'ttm': 'Trailing twelve months: the last 12 months.', 'last year': 'The previous full year.', 'ceos': 'Company CEOs.', 'my staff only': 'People working for you.',
  'candidates': 'People you can hire.', 'everyone': 'All people.', 'summary': 'Key facts.', 'wealth': 'What this person owns.', 'career': 'Jobs this person has had.',
  'personality': 'How this person behaves and decides.', 'financial': 'Money policies.', 'overview': 'Main facts at a glance.', 'city graphs': 'Charts of this city over time.',
  'economic graphs': 'GDP and its parts over time.', 'government budget': 'What the government earns and spends.', 'gdp components': 'Consumption, investment, government and trade.',
  'retail': 'Shopping in this city.', 'tourism': 'Visitors and hotels.', 'industries': 'Size of each industry.', 'city rankings': 'Compare all cities.',
  'dubai financial market': 'Dubai’s stock exchange (DFM).', 'abu dhabi securities exchange': 'Abu Dhabi’s stock exchange (ADX).', 'nyse': 'New York Stock Exchange (US shares, in AED).',
  'nasdaq': 'NASDAQ – US tech shares (in AED).', 'my holdings': 'Shares you own.', 'all sectors': 'Every kind of business.', 'consumer': 'Shops, hotels, airlines, schools.',
  'tech & media': 'Technology, internet, telecom and media.', 'banks & investment': 'Banks, finance and holding companies.', 'energy & industry': 'Oil, gas, chemicals, metals, factories.',
  'transport': 'Transport and logistics.', 'uae rich list': 'Richest people in the UAE (real people + game characters).', 'global rich list': 'Richest people in the world.',
  'ceo rankings': 'CEOs ranked by wealth or performance.', 'by value': 'Companies ranked by value.', 'by revenue': 'Companies ranked by sales.', 'by profit': 'Companies ranked by profit.',
  'by assets': 'Companies ranked by what they own.', 'cities': 'City figures.', 'economy': 'Economy reports.', 'my firms': 'Your businesses.', 'goals': 'Game goals to complete.',
  'warnings': 'Problems that need attention.', 'food & drink': 'Groceries, drinks and food products.', 'fashion & beauty': 'Clothes, shoes, jewellery, watches, perfume, skincare.',
  'electronics & devices': 'Phones, laptops, TVs, AC, AR/VR.', 'ai & chips': 'Semiconductors, CPUs, RAM, AI chips, GPUs, servers, chip design.', 'software': 'Software titles.',
  'vehicles & robots': 'Cars, EVs, robots, drones, batteries.', 'home & health': 'Furniture, medicine, toys.', 'fuel & energy': 'Fuel and petrochemicals.',
  'industrial materials': 'Cement, glass, metals, flour – sold between firms.', 'raw materials': 'Oil, gas, minerals, crops, metals.',
  'supply & demand': 'What customers want versus what sellers supply.', 'supply chain': 'How the product is made, from raw materials up.', 'products': 'Products made or sold.',
  'shareholders': 'Who owns the shares.', 'bonds & loans': 'Debt of the company.', 'rankings': 'How the company ranks.', 'last 12 months': 'The past year.', '5 years': 'The past five years.',
  'by net worth': 'Ranked by wealth.', 'by performance score': 'Ranked by business results (profit, growth, share price).',
  'valuation': 'Step by step: how the game turns book equity and profit into the company’s market value.',
  'value not on the balance sheet': 'Market value minus book equity: the price of brand, technology, customers and growth that accounting does not record.',
  'price / book': 'Market value divided by book equity. High = investors value things beyond the balance sheet.',
  'price / earnings': 'Market value divided by yearly profit: how many years of profit the company costs.',
  'how is': 'Step-by-step valuation of this company with its own numbers.', 'estimated value': 'What a private company is worth by the game’s formula.',
  'customer deposits': 'Money customers keep in your bank. You pay them interest and must keep 7% as cash.',
  'total loans': 'All money your bank has lent: companies, mortgages, personal loans and loans to game companies.',
  'net interest margin': 'Interest earned minus interest paid, per AED lent – the bank’s core profit margin.',
  'capital adequacy (car)': 'Equity ÷ risk-weighted loans. Must stay above 13% or the bank can’t lend more.', 'capital adequacy': 'Equity ÷ risk-weighted loans. Must stay above 13% or the bank can’t lend more.',
  'cost of risk': 'Money set aside for loans that won’t be repaid.', 'spare lending room': 'How much more the bank can lend today within its cash and capital rules.',
  'cash reserve': 'Cash held against deposits – at least 7% (central-bank rule).', 'products & interest rates': 'Your rates versus the market, and how big each loan book is.',
  'your rate %': 'The interest rate you charge (loans) or pay (deposits).', 'market %': 'Typical rate other banks use.', 'your book': 'How much you have lent (or hold as deposits) today.',
  'heading for': 'Where this number is moving to at your current rates and branch network.', 'interest / day': 'Interest earned or paid per day.',
  'risk appetite': 'Conservative = fewer, safer loans. Aggressive = faster growth but more bad loans.', 'income (per day)': 'Where the bank’s money comes from each day.',
  'interest earned': 'Interest from loans plus interest on spare cash (treasury).', 'interest paid': 'Interest paid to depositors.', 'fees': 'Account and card fees.',
  'bad-loan provisions': 'Expected losses on loans that won’t be repaid.', 'brokerage (total)': 'Your share of fees from all share trading in the game.',
  'underwriting (total)': 'Fees earned managing share issues and IPOs of other companies.', 'bank dashboard': 'Everything about your bank: deposits, loans, rates, capital and income.',
  'premiums (12 months)': 'Money customers paid for insurance over the last year.', 'claims ratio': 'Claims paid ÷ premiums. Lower = more profitable.',
  'combined ratio': 'Claims + costs ÷ premiums. Below 100% means insurance itself makes a profit.', 'solvency': 'Equity ÷ yearly net premiums – must stay above 15% to be safe.',
  'investment income / day': 'Interest earned on premiums held before claims are paid (the float).', 'reinsurance': 'Share of each premium and claim passed to a reinsurer – smoother results, less profit.',
  'insurance lines': 'Motor, health, property, life and commercial property – your price and results for each.', 'line': 'Type of insurance.',
  'price level': '1.00 = market price. Cheaper wins customers but attracts riskier ones.', 'premiums / day': 'Premiums received per day.', 'claims / day': 'Claims paid per day.',
  'reinsurance %': 'How much of every premium and claim you pass to a reinsurer.', 'insurance dashboard': 'Premiums, claims, solvency and settings for every insurance line.',
  'presence in': 'Your HQ + branches in this city – more presence wins more customers here.', 'bank branch': 'A branch wins deposits and loans in its city.', 'insurance office': 'An office sells insurance in its city.',
  'getting started': 'First steps for new players.', 'money basics': 'Revenue, costs, profit and cash explained.', 'shops & selling': 'How shops sell.',
  'factories & supply chains': 'Making products from raw materials.', 'r&d, software & technology': 'Research and software.', 'ceo, cmo, cto': 'Your executives.',
  'shares & the stock market': 'Buying shares and listing your company.', 'keys': 'Keyboard shortcuts.'
});
/* city names on tabs */
['dubai', 'abu dhabi city', 'al ain', 'al dhafra / ruwais', 'sharjah', 'ajman', 'umm al quwain', 'ras al khaimah', 'fujairah', 'uae'].forEach(function (c) {
  if (!UI.HELP_TERMS[c]) UI.HELP_TERMS[c] = 'Show figures for ' + c.replace(/\b\w/g, function (x) { return x.toUpperCase(); }) + '.';
});

Object.assign(UI.HELP_ACT, {
  reloadGame: 'Load a newly installed game version without closing the app (save first).', reloadYes: 'Reload the game now.', valuationOf: 'See step by step how this company is valued.', product: 'Open this product’s details.', openFirm: 'Open this firm.', personSel: 'Show this person.', maxPerson: 'Cheat: set this person’s skills and expertise to 100.',
  myLook: 'Change how your portrait looks.', hire: 'Hire this person as a manager.', fa: 'Open this financial action.', stockDetail: 'Open this company’s share page (price, trading, owners).',
  bondTrade: 'Buy or sell this bond.', persCand: 'See people you can hire.', execAllBiz: 'Let the CEO build every type of business.', execCmoPct: 'Save the CMO’s ad budget.',
  newPerson: 'Create a new person, give them a name and photo, then hire them.', hqSet: 'Save this department budget.', saveSlot: 'Save the game in this slot.',
  loadSlot: 'Load the game saved in this slot.', exportSave: 'Save a copy of the game as a file.', exportCsv: 'Export your accounts as a spreadsheet file.',
  newGame: 'Start a brand-new game.', help: 'Open the Help guide.', pdPick: 'Show this product.', depInfo: 'Details of this natural resource site.',
  adStart: 'Start this advertising campaign.', fFly: 'Fly the map to this building.', fSet: 'Save this value.', bankRates: 'Save your bank’s interest rates.',
  dcTarget: 'Save how many servers this data centre should have.', lineDel: 'Remove this product line.', releasePrices: 'Let the CEO / auto-pricing set prices again.',
  renewMax: 'Save the highest rent you accept when the lease renews.', fRename: 'Rename this firm.', polAll: 'Switch all options on.', scopeAll: 'Allow all product types.',
  polMgmt: 'Save this management policy.', polOverride: 'Set a special price level for one product.', cfPay: 'Pay this now.', tab: 'Switch view.', noop: 'Not available right now.'
});

/* Smarter matching: drop emoji, counts, "(…)", and the variable part of headings such as
 * "Your campaigns for Smartphone", "Stores in this mall (4)", "Consumer markets in Dubai (by value)". */
UI._helpLookup1 = UI.helpLookup;
UI.helpLookup = function (text) {
  var t = UI.helpNorm(text).replace(/^[^a-z0-9]+/, '').replace(/\s+\d+$/, '').replace(/\s*\(\d+\)$/, '').trim();
  if (!t || t.length > 70) return null;
  var r = UI._helpLookup1(t); if (r) return r;
  var cuts = [t.split(' · ')[0], t.replace(/ for .*$/, ''), t.replace(/ in [a-z].*$/, ' in'), t.replace(/\s*\(.*$/, ''), t.replace(/,.*$/, ''), t.replace(/ - .*$/, '')];
  for (var i = 0; i < cuts.length; i++) { var c = cuts[i].trim(); if (c && UI.HELP_TERMS[c]) return UI.HELP_TERMS[c]; var r2 = UI._helpLookup1(c); if (r2) return r2; }
  var fa = t.match(/^(fa\d+(?:\/\d+)?)/); if (fa && UI.HELP_TERMS[fa[1]]) return UI.HELP_TERMS[fa[1]];
  return null;
};
/* Also explain section headings and field labels. */
UI._helpFor1 = UI.helpFor;
UI.helpFor = function (el) {
  var r = UI._helpFor1(el); if (r) return r;
  var h = el.closest('h3, h4, .row > label, .pcard b, .phero .pname'); if (h) { var t = UI.helpLookup(h.textContent); if (t) return [h.textContent, t]; }
  var td = el.closest('td'); if (td && td.parentNode && td.parentNode.firstElementChild === td) { var t2 = UI.helpLookup(td.textContent); if (t2) return [td.textContent, t2]; }
  return null;
};

/* ---- valuation & finance additions */
Object.assign(UI.HELP_TERMS, {
  'book equity': 'Assets minus liabilities on the balance sheet = what owners have put in plus kept profits.',
  'what the balance sheet says (book value)': 'Step 1: assets minus liabilities. No self-built brand or technology is counted.',
  'what investors pay for: earnings': 'Step 2: yearly profit × the sector’s price/earnings multiple × a growth factor.',
  'fair (fundamental) value': 'Step 3: the game’s fair share price from earnings value and book equity.',
  'the share price chases the fair price': 'Step 4: each trading day the price moves 3% of the way to the fair price, plus market noise.',
  'real listed company': 'Real companies start at their real share price and then follow their profit.',
  'private company value': 'Private companies are valued at the higher of book equity or half book + 0.8 × profit × P/E.',
  'so where does the gap come from?': 'Value minus book equity = the price of brand, technology, customers and growth.',
  'bank dashboard': 'Everything about the bank: deposits, loans, rates, capital and income.', 'insurance dashboard': 'Premiums, claims, solvency and settings for every insurance line.'
});
Object.assign(UI.HELP_ACT, { bkRates: 'Save your bank’s interest rates.', bkMarket: 'Set all rates to the market rates.', insSave: 'Save insurance prices and reinsurance.',
  reloadGame: 'Load a newly installed game version without closing the app (save first).', reloadYes: 'Reload the game now.' });
/* headings like "🏦 Emirates NBD – bank dashboard": use the part after the dash */
UI._helpLookup2 = UI.helpLookup;
UI.helpLookup = function (text) {
  var r = UI._helpLookup2(text); if (r) return r;
  var t = UI.helpNorm(text); if (t.indexOf(' – ') > 0) return UI._helpLookup2(t.split(' – ').pop());
  return null;
};

Object.assign(UI.HELP_TERMS, {
  'source of value': 'What the company’s value is paying for.', 'why is': 'The company’s value split into its sources: assets, brand, technology, customers, operations, growth and market mood.',
  'why': 'Plain explanation of this source of value.', 'businesses creating the most value': 'Your firms ranked by the value their profit creates.', 'business': 'One of your firms.',
  'value it creates': 'Part of the company’s value coming from this firm’s profit.', 'main reason': 'Whether this firm’s profit comes mostly from brand, technology, customers or operations.'
});

Object.assign(UI.HELP_TERMS, { 'still owed': 'Principal not yet repaid.', 'borrowed': 'Original loan amount.', 'repaid by': 'Date the loan is fully repaid.',
  'instalment / month': 'Principal repaid automatically each month (interest is charged separately).', 'lender': 'Bank that lent the money – a game bank or an outside bank.',
  'taken by': 'Who took the loan: you, your CEO, or an automatic emergency credit line.' });

Object.assign(UI.HELP_ACT, { hireForCo: 'Open the candidate list to hire a CEO, CMO or CTO for this company (subsidiaries too).' });
Object.assign(UI.HELP_TERMS, { 'for company': 'Which of your companies (main company or a subsidiary) this person will work for.', 'move to another of your companies': 'Move this person from one of your companies to another, e.g. into a subsidiary.' });

Object.assign(UI.HELP_TERMS, { 'all categories': 'Every firm, grouped by business category.', 'retail & services': 'Shops, cafés, restaurants, gyms, malls, hotels and attractions.',
  'industry & resources': 'Factories, warehouses, farms, mines, oil wells and solar.', 'tech, media & digital': 'Software, internet, telecom, data centres, R&D and media.',
  'real estate': 'Apartments, offices and mansions.', 'banking & insurance': 'Bank HQ & branches, insurance HQ & offices.', 'trade & logistics': 'Import, export and logistics companies.',
  'corporate & civic': 'Headquarters and public buildings.' });

Object.assign(UI.HELP_TERMS, {
  'balance sheet': 'What the division owns (cash, loans) and owes (deposits / policy reserves); the rest is its equity.',
  'income statement': 'Money earned and spent by the division: this month so far, last month and year to date.',
  'loans by rating': 'Your loan book split by the borrower\'s credit rating: AAA safest and cheapest, B riskiest and highest-paying.',
  'capital: inject / withdraw': 'Move money between your company and its bank / insurer.',
  'inject into bank': 'Moves group cash into the bank\'s capital so it can lend more.', 'withdraw to': 'Takes spare capital or profits out of the division back to the company.',
  'bank equity': 'Capital injected + profits kept. Supports lending: each AED backs about 7.7 AED of risk-weighted loans.',
  'capital adequacy': 'Bank equity ÷ risk-weighted loans. Must stay at or above 13%.', 'can withdraw up to': 'The most you can take out while the bank / insurer stays above its legal minimums.',
  'retained profits': 'Past profits the division kept instead of paying out.', 'lend to companies rated': 'Minimum credit rating for corporate loans. Higher = safer but fewer borrowers.',
  'personal loans to': 'Which personal borrowers you accept: Prime (safe), Near-prime, Subprime (pays more, defaults more).',
  'default risk / yr': 'Chance a loan of this rating goes bad within a year.', 'expected loss / yr': 'Outstanding × default risk: what bad loans are likely to cost this year.',
  'risk classes': 'Customers grouped by how likely they are to claim.', 'underwriting standard': 'How picky the insurer is about who it covers.',
  'insurer equity': 'Capital injected + profits kept. Must be at least 15% of net premiums (solvency).',
  'new firms the ceo may create per month': 'Slider: the most new firms your CEO builds each month on top of normal moves. 0 = normal moves only. A cash reserve is always kept.'
});

Object.assign(UI.HELP_TERMS, {
  'trade with / trade bonds with': 'Choose who buys or sells: your personal account, the parent company, a subsidiary or your insurer. Trades use that account\'s cash.',
  'gains / losses on shares & bonds traded': 'Profit or loss when an insurer sells shares or bonds (sale price minus what it paid).',
  'your companies': 'Shares your companies (parent, subsidiaries, insurer) hold in this stock.'
});

Object.assign(UI.HELP_TERMS, {
  'business cycle': 'Where the economy is: Boom, Expansion, Slowdown, Recession or Recovery. It moves demand, rents, share prices and unemployment.',
  'cbuae base rate': 'The UAE central bank rate. It follows the US Fed because the dirham is pegged to the dollar, and sets every loan and deposit rate in the game.',
  'fiscal stance': 'Government budget policy: stimulus (extra spending) in recessions, consolidation (less spending) in booms.',
  'real growth (yr)': 'GDP growth over the last 12 months after inflation.', 'policy rate': 'The interest rate the central bank sets.',
  'rule-implied rate': 'What the Taylor rule says the rate should be, given inflation and unemployment.',
  'gov. debt / gdp': 'Government debt as a share of the economy.', 'gdp per person (aed)': 'GDP divided by population, in dirhams.', 'gdp (aed)': 'Size of the economy in dirhams (US$ × 3.6725 peg).',
  'ownership disclosure': 'Investors must tell the regulator (SCA) when they own 5% or more of a listed company.',
  'portfolio value': 'What the shares your company holds are worth at today\'s prices.', 'unrealised gain': 'Profit on shares you still hold (not yet sold).',
  'realised trading gains': 'Profit or loss on shares the CEO has sold this year, booked on the insurer\'s income statement.', 'global share': 'Part of the portfolio in NYSE / NASDAQ stocks.',
  'ceo injected': 'Money the CEO moved from the company\'s cash into this headquarters as capital.', 'ceo took back': 'Injected money the CEO withdrew when the company ran short of cash.',
  'ceo net': 'CEO injected minus CEO took back.', 'you (net)': 'What you injected by hand, minus what you withdrew.', 'earlier': 'Money already in the headquarters before this record started.',
  'total now in': 'All injected capital still in this headquarters (what can be withdrawn).',
  'why': 'The reasons the CEO gave for the trade: P/E, discount to fair value, revenue growth, profit trend, PEG and diversification.',
  'p/e': 'Price ÷ earnings per share: how many years of profit the share price costs. Lower = cheaper.',
  'fair value': 'The game\'s estimate of what a share is really worth, from earnings and book value.',
  'upside': 'How far the price could rise to reach fair value.', 'peg': 'P/E ÷ growth. Below 1 = cheap for how fast it grows.',
  'score': 'Combined investment score: upside, growth, profit trend and a cheap P/E.',
  'money you injected': 'Cash you moved from the company into this division. Only this can be withdrawn.'
});
/* 2026-11-22: development bonds, economic projects, sum-of-the-parts valuation, world exchanges */
Object.assign(UI.HELP_TERMS, {
  'economic projects': 'Government infrastructure (metro, ports, airports, power, digital). It raises the city’s GDP for good, so people and firms buy more and new jobs appear.',
  'projects under construction': 'Economic projects paid for but not finished yet; they come into service over about 18 months.',
  'gdp added by projects': 'Extra yearly GDP from finished economic projects (about 22 fils per AED invested, every year).',
  'development bonds held': 'Money your company lent the government for development. It earns interest every month and you get it back after 10 years.',
  'interest income': 'Interest paid to you each month.',
  'all companies invested': 'Total bought in development bonds by every company.',
  'subsidiaries & shareholdings': 'Your stakes in other companies counted at today’s value (stake × that company’s value), not at the price you paid.',
  'value today': 'What your stake is worth now: your share of the company × its market value (or estimated value if private).',
  'paid (book)': 'What you paid for the stake. This is what the balance sheet shows.',
  'stake': 'Share of that company you own.',
  'world': 'The biggest companies on other world stock exchanges: Saudi, London, Paris, Frankfurt, Zurich, Tokyo, Hong Kong, Taiwan, Korea, India…',
  'gdp aed bn/yr': 'Size of the city economy in AED billions per year.', 'in service': 'Economic projects that are finished and adding GDP.', 'gdp added bn/yr': 'Extra yearly GDP from finished projects in this city.'
});
Object.assign(UI.HELP_ACT, { govInvest: 'Buy development bonds: the government spends the money next month; you earn interest monthly and get it back in 10 years.', govRedeem: 'Sell this bond back to the government now for 98% of its value.', govInvSet: 'Fill in this amount.' });
