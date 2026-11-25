/* ============================================================================
 * UAE CAPITALISM LAB  -  FUTURE TECHNOLOGY (invention timeline 2026-2100)
 *
 * Products that do not exist yet. Each has an INVENTION WINDOW [from, to] (first practical version,
 * from the user's research roadmap, Nov 2026 - illustrative forecasts, EST):
 *   - research can start 5 years before the window opens (Capitalism Lab: invention first, innovation follows);
 *   - every finished research project is a chance to invent it - more R&D teams = more chances = earlier;
 *   - the world's leading labs (real companies) invent it on their own, most likely inside the window;
 *   - once invented the world market opens (size below = AED bn a year at invention) and grows from that day;
 *     the inventor starts ahead of the world, then normal world-race innovation (R&D, plants, exports) follows.
 * Format per product: [id, name, field, from, to, stage, kind, unit, price AED, plant cap / day, recipe, gross margin,
 *                      market AED bn at invention, growth / yr, growth cap (x), leaders, Wikipedia article (picture)]
 * leaders: [company, country, tech index at invention (100 = best), index gain / yr, world share]
 * kind 'g' = manufactured good (factory, sold worldwide), 's' = software (sold worldwide, ~90%+ gross margin).
 * Prices, recipes, market sizes and margins EST; companies REAL (research programmes named in public sources).
 * ==========================================================================*/
var UAE = window.UAE || (window.UAE = {});

UAE.FUTURE_FIELDS = { compute: '🖥 Computing hardware', ai: '🧠 AI & software', robot: '🤖 Robotics', energy: '⚡ Energy', med: '🧬 Medicine & human augmentation',
  space: '🚀 Space & transport', mat: '🧪 Materials & electronics' };

UAE.FUTURE_LIST = [
  // ------------------------------------------------ computing hardware
  ['photonic', 'Photonic AI Processor', 'compute', 2026, 2030, 'Prototype / early commercial', 'g', 'pc', 95000, 30, [['aichip', 4], ['optics', 0.05], ['wafer', 0.5], ['chips', 6]], 0.55, 6, 0.45, 60,
    [['Lightmatter', 'US', 100, 4.0, 0.30], ['Ayar Labs', 'US', 93, 3.5, 0.12], ['Lightelligence', 'US', 94, 3.5, 0.15], ['Celestial AI', 'US', 92, 3.5, 0.12], ['Q.ANT', 'DE', 88, 3.0, 0.08]], 'Optical_computing'],
  ['neuro', 'Neuromorphic (Brain-Inspired) Processor', 'compute', 2026, 2030, 'Prototype', 'g', 'pc', 30000, 60, [['chips', 8], ['wafer', 0.3], ['copper', 0.05]], 0.6, 3, 0.4, 50,
    [['Intel (Loihi / Hala Point)', 'US', 100, 3.5, 0.30], ['IBM (NorthPole)', 'US', 98, 3.5, 0.20], ['BrainChip', 'AU', 90, 3.0, 0.10], ['SynSense', 'CH', 88, 3.0, 0.08], ['Innatera', 'NL', 86, 3.0, 0.06]], 'Neuromorphic_computing'],
  ['imc', 'In-Memory Computing Chip', 'compute', 2026, 2029, 'Prototype / early commercial', 'g', 'pc', 22000, 80, [['chips', 6], ['ram', 8], ['wafer', 0.2]], 0.55, 5, 0.4, 40,
    [['Samsung (HBM-PIM)', 'KR', 100, 3.5, 0.30], ['SK hynix (AiM)', 'KR', 98, 3.5, 0.25], ['d-Matrix', 'US', 92, 4.0, 0.10], ['Axelera AI', 'NL', 88, 3.5, 0.08], ['Mythic', 'US', 85, 3.0, 0.05]], 'In-memory_processing'],
  ['dnastore', 'DNA Data Storage Cartridge (1 PB)', 'compute', 2028, 2035, 'Laboratory / prototype', 'g', 'cartridge', 2.2e6, 0.5, [['api', 2], ['chips', 40], ['polymer', 0.002], ['optics', 0.5]], 0.6, 4, 0.5, 80,
    [['Microsoft Research', 'US', 100, 3.5, 0.25], ['Twist Bioscience', 'US', 96, 3.5, 0.20], ['Catalog', 'US', 92, 4.0, 0.15], ['Biomemory', 'FR', 88, 3.5, 0.08], ['Iridia', 'US', 85, 3.0, 0.05]], 'DNA_digital_data_storage'],
  ['ftqc', 'Fault-Tolerant Quantum Computer', 'compute', 2029, 2035, 'Experimental systems', 'g', 'system', 4.5e8, 0.01, [['qpu', 2], ['chips', 20000], ['optics', 200], ['sensor', 2000], ['nickel', 400], ['titanium', 500]], 0.6, 25, 0.45, 60,
    [['IBM Quantum', 'US', 100, 4.0, 0.25], ['Google Quantum AI', 'US', 99, 4.0, 0.20], ['Quantinuum', 'US', 98, 4.0, 0.15], ['PsiQuantum', 'US', 95, 4.5, 0.12], ['Microsoft (Majorana)', 'US', 92, 4.5, 0.08], ['Origin Quantum', 'CN', 88, 4.0, 0.08]], 'Quantum_computing'],
  ['volumetric', 'True 3D Volumetric Display', 'compute', 2028, 2035, 'Prototype', 'g', 'pc', 45000, 50, [['chips', 20], ['optics', 0.1], ['glass', 0.01], ['sensor', 4]], 0.5, 4, 0.35, 30,
    [['Looking Glass', 'US', 100, 3.0, 0.20], ['Light Field Lab', 'US', 98, 3.5, 0.15], ['Sony', 'JP', 95, 2.5, 0.15], ['BOE', 'CN', 90, 3.0, 0.10], ['Voxon Photonics', 'AU', 92, 3.0, 0.08]], 'Volumetric_display'],
  ['arlens', 'AR Smart Contact Lens (pair)', 'compute', 2030, 2040, 'Prototype', 'g', 'pair', 11000, 300, [['chips', 1], ['sensor', 1], ['polymer', 0.00005], ['gold', 0.02], ['battery', 0.02]], 0.65, 6, 0.5, 80,
    [['Mojo Vision', 'US', 100, 4.0, 0.25], ['XPANCEO (Dubai)', 'AE', 97, 4.5, 0.20], ['Samsung', 'KR', 95, 3.5, 0.15], ['InWith', 'US', 92, 3.5, 0.10], ['Sony', 'JP', 92, 3.0, 0.10]], 'Contact_lens'],
  ['graphchip', 'Graphene Processor', 'compute', 2030, 2045, 'Laboratory', 'g', 'pc', 60000, 40, [['chips', 4], ['wafer', 0.5], ['pchem', 2], ['copper', 0.02]], 0.55, 8, 0.4, 60,
    [['Samsung', 'KR', 100, 3.5, 0.20], ['TSMC', 'TW', 99, 3.5, 0.20], ['imec', 'BE', 95, 3.0, 0.10], ['Paragraf', 'GB', 90, 3.5, 0.08], ['Graphenea', 'ES', 85, 3.0, 0.05]], 'Graphene'],
  ['biocomp', 'Biological Computer (neurons on chip)', 'compute', 2035, 2045, 'Experimental platforms', 'g', 'unit', 1.2e6, 1, [['biologic', 30], ['chips', 300], ['sensor', 40], ['optics', 0.5]], 0.6, 3, 0.5, 100,
    [['Cortical Labs', 'AU', 100, 4.0, 0.30], ['FinalSpark', 'CH', 96, 4.0, 0.20], ['Koniku', 'US', 90, 3.5, 0.10], ['Johns Hopkins (Organoid Intelligence)', 'US', 88, 3.0, 0.05]], 'Wetware_computer'],
  ['molecular', 'Molecular Assembler (nanofactory)', 'compute', 2070, 2100, 'Concept', 'g', 'unit', 9e8, 0.005, [['chips', 50000], ['optics', 300], ['sensor', 3000], ['titanium', 1000], ['rareearth', 500], ['aichip', 2000]], 0.7, 50, 0.6, 300,
    [['Zyvex', 'US', 100, 5.0, 0.20], ['Chinese Academy of Sciences', 'CN', 96, 5.0, 0.15], ['IBM Research', 'US', 98, 5.0, 0.15], ['Max Planck Society', 'DE', 95, 4.5, 0.10]], 'Molecular_assembler'],
  // ------------------------------------------------ AI & software (no factory: sold worldwide as licences)
  ['secai', 'Autonomous Cyber Defence', 'ai', 2026, 2030, 'Early products', 's', 'seat-year', 9000, 0, null, 0.9, 25, 0.3, 12,
    [['CrowdStrike', 'US', 100, 3.5, 0.20], ['Palo Alto Networks', 'US', 99, 3.5, 0.20], ['Microsoft Security', 'US', 98, 3.5, 0.20], ['SentinelOne', 'US', 94, 3.5, 0.06], ['Darktrace', 'GB', 92, 3.0, 0.06]], 'Computer_security'],
  ['privai', 'Privacy-Preserving AI Platform', 'ai', 2026, 2030, 'Partial implementations', 's', 'licence-year', 15000, 0, null, 0.9, 6, 0.4, 25,
    [['Google', 'US', 100, 3.5, 0.20], ['Apple (Private Cloud Compute)', 'US', 98, 3.5, 0.15], ['Zama', 'FR', 92, 4.0, 0.08], ['Duality Technologies', 'IL', 90, 3.5, 0.08], ['Enveil', 'US', 86, 3.0, 0.05]], 'Homomorphic_encryption'],
  ['twin', 'AI Digital Twin Platform', 'ai', 2026, 2030, 'Early products', 's', 'licence-year', 40000, 0, null, 0.9, 12, 0.3, 15,
    [['NVIDIA Omniverse', 'US', 100, 3.5, 0.20], ['Siemens Xcelerator', 'DE', 99, 3.0, 0.20], ['Dassault Systèmes', 'FR', 98, 3.0, 0.15], ['Bentley Systems', 'US', 92, 3.0, 0.08], ['PTC', 'US', 92, 3.0, 0.07]], 'Digital_twin'],
  ['neurodb', 'Neural Database Engine', 'ai', 2026, 2030, 'Early products', 's', 'licence-year', 20000, 0, null, 0.9, 5, 0.4, 25,
    [['Databricks', 'US', 98, 3.5, 0.15], ['Oracle', 'US', 96, 3.0, 0.15], ['Pinecone', 'US', 95, 3.5, 0.15], ['Weaviate', 'NL', 90, 3.5, 0.06], ['Zilliz', 'CN', 90, 3.5, 0.06]], 'Vector_database'],
  ['worldmodel', 'AI World-Model Engine', 'ai', 2026, 2030, 'Experimental systems', 's', 'licence-year', 60000, 0, null, 0.9, 4, 0.55, 80,
    [['Google DeepMind (Genie)', 'GB', 100, 4.5, 0.25], ['NVIDIA Cosmos', 'US', 98, 4.5, 0.20], ['OpenAI', 'US', 98, 4.5, 0.15], ['World Labs', 'US', 94, 4.5, 0.10], ['Wayve', 'GB', 90, 4.0, 0.05]], 'Machine_learning'],
  ['swe', 'Autonomous Software Engineer (seat-year)', 'ai', 2027, 2032, 'Early products / research', 's', 'seat-year', 30000, 0, null, 0.9, 20, 0.5, 60,
    [['Anthropic', 'US', 100, 4.5, 0.25], ['OpenAI', 'US', 100, 4.5, 0.25], ['GitHub Copilot (Microsoft)', 'US', 97, 4.0, 0.20], ['Anysphere (Cursor)', 'US', 95, 4.5, 0.08], ['Cognition (Devin)', 'US', 94, 4.5, 0.08]], 'Software_engineering'],
  ['selfheal', 'Self-Healing Software Platform', 'ai', 2027, 2033, 'Partial implementations', 's', 'licence-year', 25000, 0, null, 0.9, 8, 0.35, 20,
    [['Dynatrace', 'US', 98, 3.5, 0.15], ['Datadog', 'US', 97, 3.5, 0.15], ['ServiceNow', 'US', 96, 3.0, 0.12], ['IBM', 'US', 94, 3.0, 0.10], ['PagerDuty', 'US', 90, 3.0, 0.05]], 'Autonomic_computing'],
  ['verified', 'Formally Verified AI Software', 'ai', 2027, 2033, 'Active research', 's', 'licence-year', 50000, 0, null, 0.9, 3, 0.5, 60,
    [['AWS Automated Reasoning', 'US', 100, 4.0, 0.20], ['Microsoft Research', 'US', 98, 4.0, 0.15], ['Google DeepMind', 'GB', 98, 4.5, 0.15], ['Galois', 'US', 90, 3.0, 0.06], ['Imandra', 'GB', 88, 3.5, 0.05]], 'Formal_verification'],
  ['aios', 'AI Operating System (device-year)', 'ai', 2027, 2032, 'Early products', 's', 'device-year', 400, 0, null, 0.9, 30, 0.45, 40,
    [['Microsoft', 'US', 100, 4.0, 0.30], ['Apple', 'US', 99, 4.0, 0.25], ['Google', 'US', 99, 4.0, 0.25], ['OpenAI', 'US', 95, 4.5, 0.05], ['Huawei (HarmonyOS)', 'CN', 92, 4.0, 0.08]], 'Operating_system'],
  ['replica', 'Personal AI Replica (subscription-year)', 'ai', 2027, 2032, 'Early products', 's', 'subscription-year', 900, 0, null, 0.9, 8, 0.55, 60,
    [['OpenAI', 'US', 100, 4.5, 0.25], ['Google', 'US', 98, 4.5, 0.20], ['Meta', 'US', 96, 4.0, 0.20], ['Character.AI', 'US', 90, 4.0, 0.06], ['Delphi', 'US', 85, 4.0, 0.03]], 'Virtual_assistant'],
  ['causal', 'Causal AI Engine', 'ai', 2027, 2033, 'Early products', 's', 'licence-year', 35000, 0, null, 0.9, 3, 0.45, 40,
    [['Microsoft Research (DoWhy)', 'US', 98, 3.5, 0.15], ['causaLens', 'GB', 95, 3.5, 0.15], ['IBM', 'US', 94, 3.0, 0.10], ['Causaly', 'GB', 90, 3.5, 0.08], ['Geminos', 'US', 85, 3.0, 0.04]], 'Causal_inference'],
  ['datasci', 'Autonomous Data Scientist', 'ai', 2027, 2032, 'Early products', 's', 'seat-year', 24000, 0, null, 0.9, 6, 0.45, 40,
    [['Databricks', 'US', 100, 4.0, 0.20], ['Google Cloud', 'US', 98, 4.0, 0.15], ['Snowflake', 'US', 96, 3.5, 0.10], ['DataRobot', 'US', 92, 3.5, 0.10], ['H2O.ai', 'US', 92, 3.5, 0.08]], 'Data_science'],
  ['aisci', 'AI Scientist (discovery engine, lab-year)', 'ai', 2028, 2035, 'Research prototypes', 's', 'lab-year', 250000, 0, null, 0.9, 6, 0.55, 100,
    [['Google DeepMind', 'GB', 100, 4.5, 0.30], ['FutureHouse', 'US', 92, 4.5, 0.10], ['Sakana AI', 'JP', 92, 4.5, 0.10], ['Lila Sciences', 'US', 90, 4.5, 0.08], ['Periodic Labs', 'US', 90, 4.5, 0.08]], 'Automated_reasoning'],
  ['qos', 'Quantum Operating System (system-year)', 'ai', 2028, 2035, 'Early products', 's', 'system-year', 200000, 0, null, 0.9, 1.5, 0.5, 80,
    [['IBM (Qiskit)', 'US', 100, 4.0, 0.25], ['Riverlane', 'GB', 98, 4.0, 0.20], ['Q-CTRL', 'AU', 97, 4.0, 0.15], ['Quantum Machines', 'IL', 93, 3.5, 0.10], ['Classiq', 'IL', 92, 3.5, 0.08]], 'Qiskit'],
  ['contlearn', 'Continual-Learning AI', 'ai', 2028, 2035, 'Active research', 's', 'licence-year', 45000, 0, null, 0.9, 8, 0.5, 60,
    [['Google DeepMind', 'GB', 100, 4.5, 0.25], ['OpenAI', 'US', 99, 4.5, 0.20], ['Meta', 'US', 96, 4.0, 0.15], ['Liquid AI', 'US', 90, 4.5, 0.05], ['Sakana AI', 'JP', 90, 4.5, 0.05]], 'Incremental_learning'],
  ['selfimp', 'Self-Improving AI (enterprise licence)', 'ai', 2028, 2040, 'Active research', 's', 'licence-year', 500000, 0, null, 0.9, 40, 0.6, 120,
    [['OpenAI', 'US', 100, 5.0, 0.25], ['Google DeepMind', 'GB', 100, 5.0, 0.25], ['Anthropic', 'US', 100, 5.0, 0.20], ['Meta', 'US', 95, 4.5, 0.10], ['xAI', 'US', 94, 5.0, 0.08]], 'Recursive_self-improvement'],
  // ------------------------------------------------ robotics
  ['softrobot', 'Soft Robot Gripper System', 'robot', 2026, 2030, 'Prototype / early commercial', 'g', 'system', 65000, 40, [['motor', 2], ['sensor', 6], ['polymer', 0.002], ['chips', 10]], 0.55, 3, 0.3, 20,
    [['Festo', 'DE', 98, 3.0, 0.15], ['Soft Robotics (Schmalz)', 'US', 95, 3.0, 0.12], ['Schunk', 'DE', 94, 3.0, 0.10], ['OnRobot', 'DK', 92, 3.0, 0.10]], 'Soft_robotics'],
  ['swarm', 'Swarm Robot Squad (100 units)', 'robot', 2027, 2032, 'Prototype', 'g', 'squad', 2.5e6, 1, [['drone', 100], ['aichip', 20], ['sensor', 100], ['battery', 30]], 0.5, 6, 0.4, 40,
    [['Anduril', 'US', 100, 4.0, 0.20], ['Shield AI', 'US', 96, 4.0, 0.15], ['Helsing', 'DE', 94, 4.0, 0.10], ['Auterion', 'CH', 92, 4.0, 0.10], ['EHang', 'CN', 92, 3.5, 0.10]], 'Swarm_robotics'],
  ['artmuscle', 'Artificial Muscle Actuator Pack', 'robot', 2027, 2035, 'Laboratory / prototype', 'g', 'pack', 12000, 150, [['polymer', 0.0003], ['chips', 2], ['sensor', 1], ['gold', 0.02]], 0.6, 2, 0.4, 50,
    [['Festo', 'DE', 96, 3.0, 0.15], ['Artimus Robotics', 'US', 95, 3.5, 0.15], ['Clone Robotics', 'PL', 92, 4.0, 0.10], ['Ras Labs', 'US', 85, 3.0, 0.05]], 'Artificial_muscle'],
  ['microbot', 'Medical Microrobot (treatment kit)', 'robot', 2030, 2040, 'Laboratory', 'g', 'kit', 180000, 10, [['chips', 20], ['sensor', 4], ['biologic', 2], ['rareearth', 0.5], ['gold', 0.1]], 0.7, 5, 0.45, 60,
    [['Bionaut Labs', 'US', 98, 4.0, 0.20], ['Magnebotix', 'CH', 95, 4.0, 0.15], ['Microbot Medical', 'IL', 92, 3.5, 0.10], ['Nanoflex Robotics', 'US', 90, 3.5, 0.08]], 'Microbotics'],
  ['autosurg', 'Autonomous Surgical System', 'robot', 2030, 2040, 'Research / pilot', 'g', 'system', 2.4e7, 0.15, [['surgrobot', 1], ['aichip', 400], ['sensor', 200], ['optics', 10]], 0.65, 30, 0.3, 20,
    [['Intuitive Surgical', 'US', 100, 3.5, 0.40], ['J&J MedTech', 'US', 95, 3.5, 0.15], ['Medtronic', 'US', 95, 3.5, 0.15], ['Moon Surgical', 'FR', 90, 4.0, 0.05], ['Activ Surgical', 'US', 88, 4.0, 0.05]], 'Robot-assisted_surgery'],
  ['selfrepair', 'Self-Repairing Robot', 'robot', 2035, 2045, 'Laboratory', 'g', 'robot', 450000, 15, [['robot', 1], ['aichip', 6], ['sensor', 20], ['motor', 10], ['polymer', 0.002]], 0.55, 15, 0.4, 50,
    [['Boston Dynamics', 'US', 98, 4.0, 0.15], ['Figure AI', 'US', 97, 4.5, 0.12], ['Tesla Optimus', 'US', 97, 4.5, 0.15], ['UBTech', 'CN', 94, 4.0, 0.10], ['Toyota Research Institute', 'JP', 92, 3.5, 0.08]], 'Humanoid_robot'],
  ['livingbot', 'Living Robot (biobot)', 'robot', 2035, 2045, 'Experimental', 'g', 'batch', 150000, 10, [['biologic', 20], ['chips', 10], ['api', 1]], 0.7, 2, 0.5, 100,
    [['Fauna Systems (Xenobots)', 'US', 100, 4.5, 0.25], ['Tufts University', 'US', 98, 4.0, 0.15], ['Wyss Institute (Harvard)', 'US', 96, 4.0, 0.10]], 'Xenobot'],
  ['selfreconf', 'Self-Reconfiguring Machine', 'robot', 2070, 2100, 'Concept', 'g', 'machine', 2e6, 2, [['robot', 2], ['aichip', 20], ['motor', 30], ['sensor', 40], ['polymer', 0.003]], 0.6, 20, 0.5, 120,
    [['MIT CSAIL', 'US', 100, 5.0, 0.20], ['Boston Dynamics', 'US', 96, 4.5, 0.10], ['UBTech', 'CN', 94, 4.5, 0.12], ['Toyota Research Institute', 'JP', 94, 4.5, 0.10]], 'Self-reconfiguring_modular_robot'],
  // ------------------------------------------------ energy
  ['ssbatt', 'Solid-State EV Battery Pack (100 kWh)', 'energy', 2027, 2030, 'Pilot', 'g', 'pack', 52000, 40, [['lithium', 60], ['aluminium', 0.05], ['chips', 20], ['rareearth', 0.2]], 0.35, 40, 0.4, 25,
    [['Toyota', 'JP', 100, 3.0, 0.20], ['CATL', 'CN', 99, 3.5, 0.20], ['Samsung SDI', 'KR', 98, 3.0, 0.15], ['QuantumScape', 'US', 96, 3.5, 0.12], ['Solid Power', 'US', 90, 3.0, 0.05]], 'Solid-state_battery'],
  ['perov', 'Perovskite Tandem Solar Panel (kW)', 'energy', 2026, 2030, 'Pilot', 'g', 'kW', 1400, 600, [['glass', 0.006], ['silicon', 3], ['aluminium', 0.002], ['pchem', 0.5]], 0.35, 30, 0.35, 20,
    [['LONGi', 'CN', 100, 3.0, 0.25], ['Hanwha Qcells', 'KR', 96, 3.0, 0.12], ['Oxford PV', 'GB', 95, 3.0, 0.08], ['Microquanta', 'CN', 92, 3.0, 0.08], ['Tandem PV', 'US', 88, 3.0, 0.04]], 'Perovskite_solar_cell'],
  ['ldes', 'Iron-Air Long-Duration Battery (MWh)', 'energy', 2026, 2030, 'Pilot', 'g', 'MWh', 75000, 30, [['aluminium', 0.2], ['chips', 30], ['polymer', 0.005], ['cement', 0.5]], 0.4, 12, 0.4, 25,
    [['Form Energy', 'US', 100, 3.5, 0.30], ['ESS Inc', 'US', 92, 3.0, 0.10], ['Energy Vault', 'CH', 88, 3.0, 0.08], ['Invinity Energy Systems', 'GB', 88, 3.0, 0.07], ['Hydrostor', 'CA', 86, 3.0, 0.05]], 'Iron–air_battery'],
  ['awg', 'Atmospheric Water Generator (industrial)', 'energy', 2026, 2030, 'Early commercial', 'g', 'unit', 55000, 60, [['motor', 4], ['sensor', 4], ['chips', 10], ['aluminium', 0.03], ['copper', 6]], 0.5, 3, 0.2, 8,
    [['Watergen', 'IL', 100, 2.5, 0.20], ['SOURCE Global', 'US', 95, 2.5, 0.12], ['Genaq', 'ES', 90, 2.0, 0.06], ['Aquaria', 'US', 86, 2.5, 0.04]], 'Atmospheric_water_generator'],
  ['photosyn', 'Artificial Photosynthesis Fuel Unit', 'energy', 2030, 2040, 'Prototype', 'g', 'unit', 2.5e6, 1, [['optics', 3], ['chips', 80], ['pchem', 200], ['glass', 0.2], ['gold', 0.2]], 0.5, 10, 0.4, 60,
    [['Twelve', 'US', 98, 3.5, 0.15], ['Sunfire', 'DE', 96, 3.5, 0.12], ['Toshiba', 'JP', 94, 3.0, 0.10], ['Panasonic', 'JP', 93, 3.0, 0.10], ['SunHydrogen', 'US', 90, 3.5, 0.06]], 'Artificial_photosynthesis'],
  ['fusion', 'Fusion Power Plant Module (50 MW)', 'energy', 2035, 2050, 'Experimental reactors', 'g', 'module', 1.1e9, 0.004, [['nickel', 20000], ['titanium', 8000], ['chips', 30000], ['sensor', 5000], ['optics', 200], ['rareearth', 3000], ['cement', 20000]], 0.45, 60, 0.45, 120,
    [['Commonwealth Fusion Systems', 'US', 100, 4.0, 0.20], ['Helion Energy', 'US', 98, 4.5, 0.15], ['ITER Organization', 'FR', 96, 3.0, 0.10], ['TAE Technologies', 'US', 94, 4.0, 0.08], ['ENN Group', 'CN', 94, 4.0, 0.10], ['Tokamak Energy', 'GB', 92, 3.5, 0.06]], 'Fusion_power'],
  ['sbsp', 'Space Solar Power Station (100 MW)', 'energy', 2035, 2045, 'Experimental', 'g', 'station', 3.5e9, 0.002, [['launch', 4], ['satellite', 20], ['optics', 400], ['chips', 40000], ['sensor', 4000], ['battery', 20000]], 0.4, 15, 0.5, 120,
    [['China CAST', 'CN', 98, 4.5, 0.20], ['Caltech (SSPP)', 'US', 96, 4.0, 0.08], ['Aetherflux', 'US', 95, 4.0, 0.15], ['JAXA', 'JP', 94, 3.5, 0.10], ['Space Solar', 'GB', 92, 4.0, 0.10]], 'Space-based_solar_power'],
  // ------------------------------------------------ medicine & human augmentation
  ['organchip', 'Human-Body-on-a-Chip', 'med', 2027, 2035, 'Early commercial', 'g', 'chip', 90000, 30, [['biologic', 2], ['chips', 10], ['polymer', 0.0005], ['sensor', 4]], 0.65, 3, 0.3, 20,
    [['Emulate', 'US', 100, 3.5, 0.25], ['CN Bio', 'GB', 94, 3.5, 0.10], ['MIMETAS', 'NL', 92, 3.0, 0.10], ['TissUse', 'DE', 90, 3.0, 0.06], ['InSphero', 'CH', 90, 3.0, 0.06]], 'Organ-on-a-chip'],
  ['bioorgan', 'Bioprinted Replacement Organ', 'med', 2035, 2050, 'Laboratory', 'g', 'organ', 4.5e6, 0.5, [['biologic', 200], ['api', 5], ['polymer', 0.01], ['chips', 50]], 0.7, 30, 0.4, 60,
    [['United Therapeutics', 'US', 100, 4.0, 0.25], ['3D Systems', 'US', 94, 3.5, 0.10], ['BICO (CELLINK)', 'SE', 92, 3.5, 0.08], ['Aspect Biosystems', 'CA', 90, 4.0, 0.06], ['Organovo', 'US', 86, 3.0, 0.04]], 'Organ_printing'],
  // ------------------------------------------------ space & transport
  ['nucprop', 'Nuclear Thermal Rocket Engine', 'space', 2030, 2045, 'Engineering research', 'g', 'engine', 6e8, 0.005, [['nickel', 8000], ['titanium', 4000], ['sensor', 600], ['chips', 6000], ['rareearth', 400]], 0.45, 6, 0.3, 40,
    [['BWX Technologies', 'US', 98, 3.5, 0.20], ['Lockheed Martin', 'US', 97, 3.5, 0.20], ['General Atomics', 'US', 95, 3.5, 0.10], ['CASC', 'CN', 94, 3.5, 0.10], ['Rosatom', 'RU', 93, 3.0, 0.15]], 'Nuclear_thermal_rocket'],
  ['hyperloop', 'Vacuum-Tube Transport Line (km)', 'space', 2035, 2050, 'Test tracks', 'g', 'km', 2.2e8, 0.02, [['cement', 4000], ['aluminium', 30], ['chips', 3000], ['sensor', 600], ['motor', 400], ['rareearth', 300]], 0.35, 40, 0.35, 40,
    [['CASIC (T-Flight)', 'CN', 98, 3.5, 0.20], ['Hardt Hyperloop', 'NL', 95, 3.0, 0.10], ['Swisspod', 'CH', 92, 3.0, 0.08], ['TransPod', 'CA', 90, 3.0, 0.06], ['Zeleros', 'ES', 88, 3.0, 0.05]], 'Hyperloop'],
  ['lunarcon', 'Lunar Construction Machine', 'space', 2030, 2040, 'Prototype', 'g', 'machine', 1.2e8, 0.03, [['robot', 6], ['launch', 0.2], ['titanium', 400], ['sensor', 200], ['chips', 4000], ['battery', 500]], 0.5, 5, 0.4, 60,
    [['ICON', 'US', 98, 4.0, 0.20], ['CNSA partners', 'CN', 95, 4.0, 0.15], ['Astrobotic', 'US', 94, 4.0, 0.12], ['ispace', 'JP', 92, 3.5, 0.10], ['Redwire', 'US', 92, 3.5, 0.08]], 'Moon'],
  ['orbfab', 'Orbital Factory Module', 'space', 2035, 2045, 'Demonstration flights', 'g', 'module', 7e8, 0.01, [['launch', 1], ['satellite', 4], ['robot', 10], ['optics', 40], ['chips', 8000]], 0.5, 6, 0.45, 100,
    [['Varda Space Industries', 'US', 100, 4.5, 0.25], ['Redwire', 'US', 95, 4.0, 0.12], ['Space Forge', 'GB', 94, 4.0, 0.12], ['Axiom Space', 'US', 90, 4.0, 0.06]], 'Space_manufacturing'],
  ['astmine', 'Asteroid Mining Robot', 'space', 2040, 2060, 'Concept / early missions', 'g', 'robot', 7e8, 0.005, [['launch', 1.2], ['robot', 12], ['titanium', 2000], ['sensor', 800], ['chips', 10000], ['nickel', 1000]], 0.5, 8, 0.5, 150,
    [['AstroForge', 'US', 100, 4.5, 0.25], ['Origin Space', 'CN', 96, 4.5, 0.20], ['Karman+', 'US', 94, 4.5, 0.12], ['TransAstra', 'US', 92, 4.0, 0.10]], 'Asteroid_mining'],
  ['spaceind', 'Autonomous Space Megafactory', 'space', 2070, 2100, 'Concept', 'g', 'megafactory', 2.5e10, 0.0005, [['orbfab', 6], ['astmine', 4], ['launch', 20], ['aichip', 50000], ['robot', 400]], 0.55, 80, 0.5, 200,
    [['SpaceX', 'US', 100, 5.0, 0.30], ['CNSA / CASC', 'CN', 98, 5.0, 0.25], ['Blue Origin', 'US', 96, 5.0, 0.15]], 'Space_colonization'],
  // ------------------------------------------------ materials & electronics
  ['selfhealmat', 'Self-Healing Coating (tonne)', 'mat', 2026, 2032, 'Early commercial', 'g', 'tonne', 90000, 20, [['polymer', 0.6], ['pchem', 300]], 0.5, 6, 0.3, 15,
    [['BASF', 'DE', 98, 3.0, 0.15], ['Covestro', 'DE', 96, 3.0, 0.10], ['Arkema', 'FR', 94, 3.0, 0.08], ['Autonomic Materials', 'US', 90, 3.0, 0.04]], 'Self-healing_material'],
  ['eskin', 'Electronic Skin Sensor Sheet (m²)', 'mat', 2026, 2032, 'Prototype', 'g', 'm²', 35000, 60, [['chips', 20], ['sensor', 6], ['polymer', 0.0008], ['gold', 0.05]], 0.6, 3, 0.4, 40,
    [['Samsung (SAIT)', 'KR', 98, 3.5, 0.15], ['LG Display', 'KR', 94, 3.0, 0.10], ['Xsensio', 'CH', 92, 3.5, 0.08], ['MC10', 'US', 90, 3.0, 0.06]], 'Electronic_skin'],
  ['smartcloth', 'Smart Clothing (garment)', 'mat', 2026, 2030, 'Early commercial', 'g', 'garment', 2200, 400, [['chips', 1], ['sensor', 0.5], ['battery', 0.05], ['polymer', 0.00005]], 0.55, 8, 0.3, 15,
    [['Google (Jacquard)', 'US', 96, 3.0, 0.10], ['Nike', 'US', 94, 2.5, 0.12], ['Samsung', 'KR', 93, 3.0, 0.08], ['Hexoskin', 'CA', 92, 3.0, 0.06]], 'E-textiles'],
  ['print4d', '4D-Printed Smart Component', 'mat', 2027, 2035, 'Prototype', 'g', 'pc', 8000, 200, [['polymer', 0.0004], ['pchem', 5], ['chips', 0.5]], 0.55, 3, 0.4, 40,
    [['Stratasys', 'US', 98, 3.5, 0.15], ['HP', 'US', 95, 3.0, 0.10], ['Autodesk', 'US', 94, 3.0, 0.10], ['Nervous System', 'US', 85, 3.0, 0.03]], '4D_printing'],
  ['camo', 'Adaptive Camouflage Panel (m²)', 'mat', 2030, 2040, 'Prototype', 'g', 'm²', 60000, 30, [['chips', 20], ['sensor', 10], ['polymer', 0.0005], ['optics', 0.02]], 0.55, 4, 0.35, 30,
    [['BAE Systems', 'GB', 98, 3.5, 0.20], ['Lockheed Martin', 'US', 97, 3.5, 0.15], ['Saab', 'SE', 96, 3.5, 0.15], ['Hyperstealth Biotechnology', 'CA', 88, 3.0, 0.04]], 'Active_camouflage'],
  ['wcharge', 'Room-Scale Wireless Charger', 'mat', 2028, 2035, 'Prototype', 'g', 'unit', 4500, 300, [['chips', 3], ['copper', 2], ['sensor', 1], ['polymer', 0.00005]], 0.5, 4, 0.4, 40,
    [['Xiaomi', 'CN', 96, 3.5, 0.12], ['Energous', 'US', 95, 3.5, 0.12], ['Ossia', 'US', 94, 3.5, 0.10], ['Wi-Charge', 'IL', 92, 3.5, 0.08], ['Powercast', 'US', 90, 3.0, 0.06]], 'Wireless_power_transfer'],
  ['progmatter', 'Programmable Matter (kg)', 'mat', 2040, 2060, 'Concept / laboratory', 'g', 'kg', 500000, 5, [['chips', 200], ['aichip', 10], ['sensor', 50], ['motor', 20], ['rareearth', 5]], 0.6, 10, 0.45, 120,
    [['MIT Self-Assembly Lab', 'US', 100, 4.5, 0.20], ['Carnegie Mellon (Claytronics)', 'US', 98, 4.5, 0.15], ['Chinese Academy of Sciences', 'CN', 96, 4.5, 0.15], ['Max Planck Society', 'DE', 94, 4.0, 0.10]], 'Programmable_matter']
];

/* Products already invented before the game starts (added 2026-11-25): only shown on the timeline. */
UAE.FUTURE_PRE = { qpu: [2019, 'Quantum computers (noisy, pre-fault-tolerant)', 'compute'], qcloud: [2016, 'Cloud access to quantum computers', 'ai'],
  qsensor: [2024, 'Quantum navigation sensors', 'compute'], bci: [2024, 'Brain-computer interface implants (first human trials)', 'med'],
  bionic: [2015, 'Myoelectric bionic limbs', 'med'], exo: [2012, 'Powered exoskeletons', 'med'], genether: [2017, 'Approved gene therapies', 'med'],
  evtol: [2026, 'eVTOL air taxis (Dubai service launch)', 'space'], aiagent: [2025, 'Enterprise AI agents', 'ai'] };

(function () {
  var T = UAE.FUTURE_TECH = {}, W = UAE.WORLD_MKT, prods = [];
  UAE.FUTURE_LIST.forEach(function (r) {
    var id = r[0], kind = r[6], price = r[8], rec = r[10];
    var P = { id: id, name: r[1], cls: (UAE.FUTURE_FIELDS[r[2]] || r[2]).replace(/^\S+\s/, ''), kind: kind === 's' ? 'software' : 'inter', unit: r[7], future: true };
    if (kind === 's') { P.ref = price; P.imp = price * 0.8; P.t = 0.000001; P.src = 'software'; P.perCap = 0; P.tour = 0; P.el = -0.5; P.cap = 50; P.qImp = 75; P.b2b = 0; P.sw = r[1]; }
    else { P.world = price; P.imp = Math.round(price * 1.07); P.t = Math.max(0.000001, price / 2e7); P.src = 'factory'; P.qImp = 75; P.b2b = 0; P.rec = { in: rec, cap: r[9], lab: 0, gm: r[11] }; }
    prods.push(P);
    T[id] = { from: r[3], to: r[4], stage: r[5], field: r[2], wiki: r[16] };
    W[id] = { size: r[12], grow: r[13], cap: r[14], fut: true, margin: '~' + Math.round(r[11] * 100) + '% gross target (EST)', leaders: r[15] };
  });
  UAE.PRODUCTS.push.apply(UAE.PRODUCTS, prods);
  UAE.PRODUCTS.forEach(function (p) { UAE.P[p.id] = p; });
  // labour & other unit costs: price x (1 - target gross margin) - inputs at import price (+11% landed), at least 4% of the price
  prods.forEach(function (P) {
    if (!P.rec) return;
    var inp = P.rec.in.reduce(function (s, x) { var Q = UAE.P[x[0]]; return s + x[1] * (Q ? (Q.imp || Q.world || 0) * 1.11 : 0); }, 0);
    P.rec.lab = Math.round(Math.max(P.world * 0.04, P.world * (1 - P.rec.gm) - inp));
  });
  if (UAE.SW_PID) prods.forEach(function (P) { if (P.sw) UAE.SW_PID[P.sw] = P.id; });
  ['BE', 'PL', 'SE', 'RU', 'CA', 'ES', 'NL', 'DK', 'AU', 'AE'].forEach(function (k) {
    if (!UAE.NATION_FLAG[k]) UAE.NATION_FLAG[k] = { BE: '🇧🇪', PL: '🇵🇱', SE: '🇸🇪', RU: '🇷🇺', CA: '🇨🇦', ES: '🇪🇸', NL: '🇳🇱', DK: '🇩🇰', AU: '🇦🇺', AE: '🇦🇪' }[k];
  });
})();
