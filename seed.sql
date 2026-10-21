INSERT INTO products (id, name, brand, model, category, retailer, purchase_date, purchase_price, currency, warranty_months, return_deadline, notes)
VALUES ('10000000-0000-4000-8000-000000000001', 'Wireless headphones', 'Northstar Audio (fictional demo brand)', 'NS-Buds 2', 'Audio', 'Demo retailer', CURRENT_DATE - INTERVAL '8 months', 2499, 'INR', 12, CURRENT_DATE - INTERVAL '7 months', 'Fictional demo product. Do not treat sample terms as real manufacturer policy.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, name, brand, model, category, retailer, purchase_date, purchase_price, currency, warranty_months, notes)
VALUES ('10000000-0000-4000-8000-000000000002', 'Laptop', 'Example Computing (fictional demo brand)', 'EC-14', 'Computers', 'Demo retailer', CURRENT_DATE - INTERVAL '4 months', 54999, 'INR', 12, 'Fictional demo product; coverage must be verified.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cases (id, product_id, title, issue_description, symptoms, status, priority, user_goal, outcome_note)
VALUES ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Left earbud has no sound', 'One earbud stopped producing sound during normal use.', 'Left earbud silent; right earbud works; issue not yet diagnosed.', 'investigating', 'normal', 'resolve_without_unnecessary_cost', 'Seeded fictional demonstration case.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO evidence (id, case_id, product_id, title, source_type, source_reference, excerpt, verification_status)
VALUES ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Demo troubleshooting guide', 'demo_document', 'seed://northstar-buds-2/troubleshooting', 'Fictional demo guidance: confirm both earbuds are charged, clean contact points gently using the manufacturer-approved method, forget and re-pair Bluetooth, then follow the reset instructions for the exact model.', 'demo_only')
ON CONFLICT (id) DO NOTHING;

INSERT INTO evidence (id, case_id, product_id, title, source_type, source_reference, excerpt, verification_status)
VALUES ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Demo warranty summary', 'demo_document', 'seed://northstar-buds-2/warranty', 'Fictional demo terms: the product listing states a 12-month limited warranty, subject to exclusions and inspection. This sample is not a real warranty and does not establish eligibility for free service.', 'demo_only')
ON CONFLICT (id) DO NOTHING;

INSERT INTO troubleshooting_attempts (id, case_id, step_title, instructions, result, user_note)
VALUES ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Check charge and contact points', 'Confirm the case and both earbuds are charged. Inspect contact points and clean only using approved guidance.', 'not_tried', '')
ON CONFLICT (id) DO NOTHING;

INSERT INTO troubleshooting_attempts (id, case_id, step_title, instructions, result, user_note)
VALUES ('40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Forget and re-pair Bluetooth', 'Remove the headphones from Bluetooth settings, restart the device, and pair again using the product instructions.', 'not_tried', '')
ON CONFLICT (id) DO NOTHING;