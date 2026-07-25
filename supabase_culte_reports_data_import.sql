-- ============================================================
-- Import des donnees historiques vhdjibi3gestion (Firestore)
-- Genere automatiquement -- relire avant execution
-- ============================================================

-- Types de reunion --
INSERT INTO culte_report_meeting_types (id, church_id, name, description, legacy_firestore_id) VALUES
('2119068d-be39-44ff-aaac-1a116975de04', 'bergerie', '2e Culte de Célébration & Contemplation', NULL, '5CRmfoyZ6kgf41oHrYCB'),
('645cea6d-2969-47c8-9e61-c0ec50f3518e', 'bergerie', 'JEUNE ET PRIERE ', NULL, '8hiNzV1NHBfTcdMGVyzj'),
('2ce42945-3831-4ef6-982b-3891589cbd2d', 'bergerie', 'Mardi du Mariage', 'Programme dirigé par le département couple d''Honneur. 
Qui a pour objectif de gérer et d''avoir les couples épanouis. ', 'M14bQdAvZrH9Awaeoy6a'),
('9bf2d72a-c692-40ed-8c9b-8ff60986fb95', 'bergerie', 'Matinale de Prières', NULL, 'TER5OxWPUTreuoj1f70K'),
('1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'bergerie', 'Rendez-Vous des Champions', NULL, 'TOPeCqB0DMwIqZsSJw23'),
('342b0930-8c28-4fa2-9674-91290df2bf45', 'bergerie', '1er Culte de Célébration & Contemplation', NULL, 'Yhybi8cDMlyaX0pt00hz'),
('068f255c-f24c-4e11-af66-607b8c42f229', 'bergerie', 'Séminaire', NULL, 'b3VcMD0J8Zrq4EFjAJzd'),
('2121e6a8-1df7-4842-8447-6b918a69be81', 'bergerie', 'CULTE DES BOSS', NULL, 'cLEenvArfkMwADiG4MPk'),
('6985bfef-b10d-4483-b032-7b3f8bde144f', 'bergerie', 'Veillée de Prière', NULL, 'pNI7koPBZlomixCKAVXh')
ON CONFLICT DO NOTHING;

-- Orateurs --
INSERT INTO culte_report_speakers (id, church_id, name, description, legacy_firestore_id) VALUES
('058bfd77-0eb6-4e7d-894a-2205154c4dfa', 'bergerie', 'PASTEUR MARCELO TUNASI', NULL, '2GW2Kl827oGHGy2Yuxfz'),
('2f568256-a169-44bc-8cf4-831bdf9a7495', 'bergerie', 'Pasteure Rachelle Sezan', NULL, '9IpFRHVFBwcvasDBLybj'),
('b4703388-9e81-4c28-ba55-ce150d8bf733', 'bergerie', 'Pasteur Wilfried SEZAN', NULL, 'IXuxkP4Xwx5YwjR4ZvFr'),
('89e3b118-0d31-4c9f-b919-b463f01b456c', 'bergerie', 'PASTEUR YOMO SAMUEL ', 'PASTEUR RESIDENT VH PORTE DES CIEUX DE COTONOU ', 'JZQ9BUtwYPmrFL5hzyAf'),
('190b7d0f-ebe2-4c6e-89fd-687be300e028', 'bergerie', 'Apôtre Mohammed SANOGO', NULL, 'Pzh6RV6Ms009BckuHTDJ'),
('6753a15f-8ce8-41d2-a769-6e833228f46d', 'bergerie', 'Pasteur Frederick VAZ FERNANDES', NULL, 'S2ZWGc1V8A93JBRLDyrx'),
('78d6bcb2-9e9a-4b04-9a59-a83645868350', 'bergerie', 'EVANGELISTE AZIALO', NULL, 'SBh6nXHslq72CD4IDXVY'),
('f28860f6-6074-4eff-8ed6-d1fcae210a7b', 'bergerie', 'Pasteur Léonard WADJA', NULL, 'TKid1R9VbtuzesxpewvH'),
('454fc9bc-f16b-45cd-a3e4-aa04717c5d79', 'bergerie', 'Pasteur Thierry N''DOUFOU', NULL, 'UAGJt9kfqqqfmEB3r5g0'),
('e3b6e304-8642-4467-abea-2c90aaf75e43', 'bergerie', 'AP CHRISTIAN ', NULL, 'ZIvFMt1AsEITxXOEdrrA'),
('60d9201e-bbd8-4e63-a96f-2ac2e02ebe34', 'bergerie', 'PASTEUR LILIABE SANOGO', 'PASTEUR RESIDENT DU CENTRE KODESH ', 'c86fNK4H3T85pars4bs0'),
('459f1e2c-2d11-45ec-a6b8-059bc50f9473', 'bergerie', 'PASTEUR YAO SANDRA', NULL, 'iPqcdLuTeHnEFlZP9SZp'),
('5b5e1724-1784-49d1-8a41-feb380cd47c3', 'bergerie', 'Pasteur Jean Michel EHOUO', NULL, 'oBQ2fbjM8NTcjVMeowa6'),
('77dcce5b-579f-40e0-b90e-dd20685e3f1f', 'bergerie', 'Pasteur  ADOPO ', NULL, 'uCn53pgkx2hCcTyKnaKV'),
('8dabf422-2f64-42a2-af6c-905ce6777a47', 'bergerie', 'REVEREND STEVE MENSAH ', NULL, 'vtamWqI6w8buh5ryC5ar')
ON CONFLICT DO NOTHING;

-- Rapports de culte (tous types) --
INSERT INTO culte_reports (id, church_id, report_type, department_id, department_name, worship_report_id, service_date, meeting_type_id, meeting_type_name, submitted_by, submitted_by_name, data, notes, needs_notes, legacy_firestore_id, created_at, updated_at) VALUES
('27795b0d-19b4-4f83-839d-2e246031062b', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-01-07', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"BENEDICTIONS : CONSECRATION","messageSource":"APOTRE MOHAMMED SANOGO : BENEDICTION 2026 ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":16,"women":21},"children":{"boys":2,"girls":1},"served":{"men":11,"women":11},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":40,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Gestion des cultes en retard
•⁠  ⁠La com n’était pas prête au moment du lancement du culte 
•⁠  ⁠Montée du dirigeant avec 2 mn de retard 
•⁠  ⁠Débordement global de 20 mn  
', NULL, '00ytvg4aTuZ0m89BLG1F', '2026-02-17T12:00:40.014Z', '2026-06-14T00:37:17.237Z'),
('cbac0d4c-3da9-4b39-97f7-2ece3a32115e', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-05-08', '068f255c-f24c-4e11-af66-607b8c42f229', 'Séminaire', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"JOUR 2: RÉUSSIR MON MARIAGE UNE PRIORITE POUR MA DESTINEE ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Frederick VAZ FERNANDES","attendance":{"adults":{"men":52,"women":70},"children":{"boys":7,"girls":5},"served":{"men":25,"women":15},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":134,"totalNewMembers":0}'::jsonb, 'Le tapis sous la caméra était encore plié, plusieurs personnes ont manqué de tomber 
- L’offrande n’a pas été faite 
- Débordement de 2h50min', NULL, '0U89FSLHkkIS1nUT4BHm', '2026-05-09T21:29:51.927Z', '2026-05-10T15:17:08.054Z'),
('403d5c99-09af-4cd5-ae1d-92395bfd1422', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-02-15', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"COMMENT PRIER SELON LA VOLONTE DE DIEU? ","messageSource":"Message du Pasteur Mohammed SANOGO. ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":40,"women":70},"children":{"boys":16,"girls":14},"served":{"men":19,"women":24},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":7,"women":2,"blooms":0,"children":0},"totalParticipants":140,"totalNewMembers":9}'::jsonb, '  Souci de son pendant les good news 
. Souci avec le micro de la dirigeante au moment de la sainte cène  
', NULL, '0uU27SS9Lwn6XHjyzXZO', '2026-02-17T11:33:15.936Z', '2026-06-14T00:37:17.391Z'),
('42cc37f8-d413-492c-baa3-8a40c0caa5bc', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-03-29', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA CONSÉCRATION DES YEUX","messageSource":"Pasteur Marcelo ","speakerName":"PASTEUR MARCELO TUNASI","attendance":{"adults":{"women":67,"men":35},"children":{"girls":21,"boys":18},"conversions":{"women":0,"men":0},"served":{"women":27,"men":19},"blooms":0},"newMembers":{"men":1,"women":1,"blooms":0,"children":0},"totalParticipants":141,"totalNewMembers":2}'::jsonb, '- le temps du récap n’a pas été pris en compte dans le timing 
- Débordement global de 38min 
', NULL, '1LK5ahaLIWucni7CvGuB', '2026-03-29T13:29:56.945Z', '2026-06-14T00:37:17.533Z'),
('a87b914d-3671-4f8b-8db2-abc9cc4313b1', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-10-22', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"LA PAIX DE DIEU","messageSource":"BOOST REFLETE LA PAIX DIVINE : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":11,"women":25},"children":{"boys":5,"girls":4},"served":{"men":8,"women":0},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":45,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Omission du temps de la dirigeante sur le timing 
•⁠  ⁠Débordement de 20min
Sonnerie entendu durant les goodnews
Absence d''eau sur le pupitre
', NULL, '2LZnxHHeGFCeeYx2yFip', '2025-10-23T14:05:06.858Z', '2025-10-23T14:05:06.858Z'),
('296de74c-65e0-4cd6-bd1f-d23158dacc7b', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-06-07', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"2E CULTE: PÈRE APPREND MOI À BIEN TE DEMANDER ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"served":{"women":29,"men":8},"blooms":0,"conversions":{"women":0,"men":0},"adults":{"women":72,"men":39},"children":{"girls":15,"boys":21}},"newMembers":{"men":0,"women":2,"blooms":0,"children":0},"totalParticipants":147,"totalNewMembers":2}'::jsonb, 'Point des véhicules : 14
Voitures : 12
Moto : 2

Observations : 
- le culte a été lancé 5min en retard dû au débordement du 1er culte 
- le récap de la fête des mères n’était pas prévu pas le timing 
- Débordement de 18min sur le temps normal de prédication 
- Débordement global de 11min 
', NULL, '2nw0F0k8YUOO3xhiCvwZ', '2026-06-07T10:44:15.155Z', '2026-06-07T13:31:31.627Z'),
('630f81cb-8b3a-43d3-9ca8-6d5ccd164fec', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-02-25', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA PUISSANCE DE LA PAROLE DE DIEU ","messageSource":"MESSAGE APÔTRE MOHAMMED SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":16,"women":24},"children":{"boys":1,"girls":1},"served":{"men":13,"women":16},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":42,"totalNewMembers":0}'::jsonb, '- Problème de son au démarrage de la vidéo de proclamation.
- Interférence sonore : le son de la vidéo de proclamation s''est déclenché pendant l''adoration du groupe musical .
- Débordement du culte de 15min ', NULL, '3zqonJWmOVz0TQGGqvdY', '2026-02-25T23:14:01.804Z', '2026-06-14T00:37:17.679Z'),
('3b3dde30-d30a-406b-8633-df3958922ef4', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-06-09', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"MARDI DU MARIAGE: LES TEMPERAMENTS","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":21,"women":27},"children":{"boys":2,"girls":2},"served":{"men":15,"women":15},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":52,"totalNewMembers":0}'::jsonb, 'Engins roulants: 16
Voitures:15
Moto:1

Observations.                                     Baisse de tension durant la prière du dirigeant
- Bruit de bebe pendant l’adoration et la modération du pasteur.
-  2 écrans éteins du à un câble cassé.
- Distraction des serviteurs (mouvements excessifs, sortant généralement bavarder hors de la salle )
- Débordement de 25 min pour la modération du pasteur.
- Débordement globale de 52 min', NULL, '47Oj9guvRHESf5Dp5gG8', '2026-06-10T22:35:54.601Z', '2026-06-11T12:21:52.461Z'),
('65d560a2-b85d-408c-b972-1dad335e8ba6', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-11-12', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"RDV  DEVANT LE TRONE DE LA GRACE","messageSource":"APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":21,"women":26},"children":{"boys":3,"girls":3},"served":{"men":9,"women":10},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":53,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Débordement global de 18mn 
•⁠  ⁠Son fort dans la salle 
•⁠  ⁠Absence de mouchoirs sur la chaire 
•⁠  ⁠Absence de PH et mouchoirs au niveau des toilettes des femmes 
•⁠  ⁠Bruits de la porte principale du temple à l’ouverture et à la fermeture 
•⁠  ⁠Affichage des versets pas synchronisé au Pasteur 
•⁠  ⁠Tenue des chantres inadaptées : une robe trop courte et une avec une tenue sans manches 
•⁠  ⁠Chantres sur la chaire sans médailles parce que arrivées en retard 
', NULL, '4c9lHYtiO1Jv8tK5VdB4', '2025-11-13T16:13:44.081Z', '2025-11-13T16:13:44.081Z'),
('41a04f05-e3bc-4f81-ae70-dc11219a2199', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-01-25', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"QUE TA VOLONTE SOIS FAITES ","messageSource":"APOTRE MOHAMMED SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":46,"women":70},"children":{"boys":27,"girls":16},"served":{"men":14,"women":19},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":1,"women":1,"blooms":0,"children":0},"totalParticipants":159,"totalNewMembers":2}'::jsonb, '•⁠  ⁠Son du micro de la dirigeante faible 
•⁠  ⁠Débordement de 9min dû aux annonces 
', NULL, '5CefGCnrQ3q1wW00jrrF', '2026-02-17T12:45:08.216Z', '2026-06-14T00:37:17.819Z'),
('6ecc8b07-0189-40f6-9c94-cd0c000584a3', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-12-07', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"TON ROYAUME EN ACTION ","messageSource":"LA PRIERE QUI PRODUIT LA SURABONDANCE : APOTRE MOHAMMED SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":42,"women":67},"children":{"boys":26,"girls":23},"served":{"men":23,"women":0},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":1,"women":2,"blooms":0,"children":0},"totalParticipants":158,"totalNewMembers":3}'::jsonb, '•⁠  ⁠Mauvais positionnement des portiers à la 2e offrande 
•⁠  ⁠Débordement de 12min 

', NULL, '5VyiMP0tMEzCPIx66SYx', '2025-12-10T12:59:56.070Z', '2025-12-10T12:59:56.070Z'),
('54896d20-094d-4a65-bf37-cd56cdfe7b98', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-04-12', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"1ER CULTE: CHERCHER DIEU ET NON LES SOLUTIONS DE DIEU ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":30,"women":45},"children":{"boys":5,"girls":4},"served":{"men":20,"women":32},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":2,"blooms":0,"children":0},"totalParticipants":84,"totalNewMembers":2}'::jsonb, '- Son faible au lancement de la vidéo de proclamation 
- Souci avec le micro du pasteur au début de la prédication 
- Débordement de la prédication de 10min 
- Son faible au lancement des good news
- Son fort à la réception des nouveaux 
- Débordement global de 9min 
', NULL, '5h0OlvgOWJt66ybqraOP', '2026-04-12T10:46:07.377Z', '2026-06-14T00:37:17.967Z'),
('1d2891de-e0ca-487d-a152-be003fba5733', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-03-08', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"COMMENT RENONCER A SA VIE ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"served":{"women":23,"men":18},"adults":{"women":65,"men":35},"children":{"girls":21,"boys":17},"conversions":{"women":0,"men":0},"blooms":0},"newMembers":{"children":4,"blooms":0,"men":2,"women":2},"totalParticipants":138,"totalNewMembers":8}'::jsonb, '- Retard dans le lancement du culte : décompte mis en retard
- Souci avec la caméra 
- La sainte cène a fait servir une femme en pantalon Jean 
- Débordement de 14min 
', NULL, '5zCZ3SEYDFSIh7Rng744', '2026-03-08T12:33:26.627Z', '2026-06-14T00:37:18.112Z'),
('6bf3ca89-d6d5-45d9-9f3e-de1d0d64b4af', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-11-23', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"POSITION CELESTE: NOTRE PERE QUI EST AUX CIEUX.. ","messageSource":"la prière qui produit la surabondance : Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":35,"women":63},"children":{"boys":19,"girls":17},"served":{"men":23,"women":24},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":6,"women":4,"blooms":0,"children":0},"totalParticipants":134,"totalNewMembers":10}'::jsonb, '•⁠  ⁠chaleur dans la salle pendant la louange 
•⁠  ⁠Problème de son avec le second micro du pasteur
•⁠  ⁠mauvais Positionnement de la lead : elle doit être dans le viseur de la caméra 
•⁠  ⁠Le son du micro du pasteur était fort pendant la prédication 
•⁠  ⁠Bruits à la com 
', NULL, '6nYO3F8y3igdGhA1q8aU', '2025-11-23T17:13:01.976Z', '2025-11-23T17:13:01.976Z'),
('f7c81d0b-aef8-4ba7-8b51-d59b1ea5d1ef', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-07-12', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"1ER CULTE: ALLER PLUS LOIN POUR PARDONNER ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":21,"women":29},"children":{"boys":4,"girls":2},"served":{"men":13,"women":17},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":1,"women":1,"blooms":0,"children":0},"totalParticipants":56,"totalNewMembers":2}'::jsonb, 'Point des véhicules : 9
Voitures : 7
Motos : 2

Observations : 
- La prière de remerciements à Dieu pour les bacheliers n’a pas été prise dans le timing
- une personne est passée par la portes côté dirigeant 
- Débordement de 5min pour les good news 
- Débordement global de 35min
', NULL, '7ziG2A7kN3cMhJHiiE6B', '2026-07-12T11:32:59.117Z', '2026-07-12T11:32:59.117Z'),
('0c1a3390-8ba2-46aa-b079-e1687299282d', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-07-19', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"1ER CULTE: LA QUESTION QUI DÉRANGE ","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"children":{"girls":4,"boys":5},"blooms":0,"conversions":{"men":0,"women":0},"served":{"women":22,"men":15},"adults":{"men":23,"women":36}},"newMembers":{"blooms":0,"children":0,"women":1,"men":0},"totalParticipants":68,"totalNewMembers":1}'::jsonb, 'Point des Véhicules: 14
Voiture : 12
Moto: 2

Observations : 
	⁃	culte débuté avec 04 minutes de retard 
	⁃	1 nouveau (une fille)
	⁃	Débordement global de 23 minutes pour le culte
	⁃	Débordement de 9minutes pour la prédication 
 
', NULL, '86wAOG89NMQYctIuoBTD', '2026-07-19T10:49:36.128Z', '2026-07-19T10:49:36.128Z'),
('593ae85a-a0df-479f-be1d-a91e5c86031b', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-04-17', '645cea6d-2969-47c8-9e61-c0ec50f3518e', 'JEUNE ET PRIERE ', NULL, 'Inconnu (ancien système)', '{"messageTheme":"TEMPS D’INTERCESSION ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":16,"women":28},"children":{"boys":1,"girls":2},"served":{"men":13,"women":19},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":47,"totalNewMembers":0}'::jsonb, '-la chantre et la dirigeante était en jean 
- Souci de son avec le micro de la 2e dirigeante 
- Débordement de 53min ', NULL, '8GfrUSVEhrTzfsOMK1Kf', '2026-04-17T22:55:44.742Z', '2026-06-14T00:37:18.253Z'),
('626193ad-009e-4116-a480-67cc5e34894b', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-11-30', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"QUE TON NOM SOIT SANCTIFIE","messageSource":"APPRENDS-MOI A PRIER : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":49,"women":64},"children":{"boys":26,"girls":21},"served":{"men":21,"women":27},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":3,"women":4,"blooms":0,"children":0},"totalParticipants":160,"totalNewMembers":7}'::jsonb, ' . Débordement global de 20 mn dû aux durées des annonces et témoignages non pris en compte sur le timing initial  

     .Problème avec l’impression du timing 
•⁠  ⁠Le son global était fort et le son du micro du Pasteur était trop fort au début 
•⁠  ⁠affichage des versets lents
 Mauvaise préparation globale du culte  :
•⁠  ⁠Mauvaise coordination du lancement de under The trees 
•⁠  ⁠Non affichage du timing pendant les interventions leaman et under The trees 

•⁠  ⁠Non prise en charge des vidéos reçues ce jour dans les good news 

•⁠  ⁠⁠La dirigeante a oublié d’ouvrir son micro et de demander aux personnes baptisées de se lever 
•⁠  ⁠⁠Les portiers n’anticipent pas le repérage des places libres dans le culte 
•⁠  ⁠⁠Portier Eliada non briefée sur les dispositions pour les offrandes 
•⁠  ⁠Les portiers ont oublié de récupérer le box des offrandes⁠
', NULL, '90FZ6AAcFsFkUxU3SUlR', '2025-12-02T10:18:39.887Z', '2025-12-02T10:18:39.887Z'),
('ecabcabd-6ed3-4155-bac2-a33a668c579b', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-04-12', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"2E CULTE : CHERCHER DIEU ET NON LES SOLUTIONS DE DIEU ","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":34,"women":60},"children":{"boys":19,"girls":13},"served":{"men":21,"women":34},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":126,"totalNewMembers":0}'::jsonb, 'culte terminé une minute en avance 
Lenteur dans l’affichage des versets ', NULL, '95YmPJ1KIpyDkFarhYvg', '2026-04-12T13:16:21.387Z', '2026-06-14T00:37:18.396Z'),
('e88ddcfa-d17c-4d06-8932-f77010585e55', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-06-08', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA PLUIE DE L''ARRIERE SAISON ","messageSource":"EFFUSION 2025 JOUR 2 : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"blooms":0,"served":{"men":18,"women":17},"children":{"boys":20,"girls":12},"conversions":{"men":0,"women":0},"adults":{"men":32,"women":49}},"newMembers":{"men":2,"blooms":0,"women":3,"children":0},"totalParticipants":113,"totalNewMembers":5}'::jsonb, NULL, NULL, '9rCYIjfMPZZSm4smIPBr', '2025-06-08T14:45:04.366Z', '2026-06-14T00:37:18.553Z'),
('1b20974a-56d6-4d6f-a470-b43004d5104d', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-01-18', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"HONORE TA SOURCE  ","messageSource":"PREMIER MESSAGE DE L''ANNEE: APOTRE MOHAMMED SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":39,"women":66},"children":{"boys":18,"girls":15},"served":{"men":15,"women":17},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":2,"women":4,"blooms":0,"children":0},"totalParticipants":138,"totalNewMembers":6}'::jsonb, '•⁠  ⁠son faible dans le micro de la dirigeante au début 
•⁠  ⁠Débordement de 20min
•⁠  ⁠⁠Les enveloppes que les portiers ont donné au Pasteur étaient mélangées à celles de CJS 
', NULL, 'A8xCoPL5WW1fQfQBWlxM', '2026-02-17T12:15:00.380Z', '2026-06-14T00:37:18.703Z'),
('2d76e32c-82d6-4d33-b989-42bab98b923f', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-08-17', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LES BONNES COUTUMES A AVOIR POUR PRIER SUITE","messageSource":"APPRENDS-MOI A PRIER : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"women":62,"men":45},"conversions":{"women":0,"men":0},"served":{"men":15,"women":18},"children":{"boys":18,"girls":8},"blooms":0},"newMembers":{"men":2,"children":0,"blooms":0,"women":1},"totalParticipants":100,"totalNewMembers":3}'::jsonb, NULL, NULL, 'A9VKhR8Porens1iGEimG', '2025-08-25T08:59:42.413Z', '2026-06-14T00:37:18.840Z'),
('f60cb03e-7c41-4f86-82d1-c63f75c3ce88', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-05-14', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"DEVENIR UN CHAMPION DE DIEU","messageSource":"PLEINEMENT BENI 12 - la benediction de l''Elevation : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"conversions":{"women":0,"men":0},"children":{"girls":8,"boys":10},"blooms":0,"served":{"women":13,"men":17},"adults":{"men":21,"women":27}},"newMembers":{"women":3,"men":2,"children":0,"blooms":0},"totalParticipants":66,"totalNewMembers":5}'::jsonb, '•⁠  ⁠Retard des chantres === Le pasteur a été obligé de faire l’adoration
•⁠  ⁠Débordement du message de 13mn 
•⁠  ⁠Problème de son lors des goods news avec la Com
•⁠  ⁠⁠Cris des enfants pendant le culte 
•⁠  ⁠⁠Lenteur d’affichage des versets 
•⁠  ⁠⁠Problème avec la sono pour le micro portatif 
•⁠  ⁠⁠Problème de son au moment des good news ( les good news n’ont pas été passées)
', NULL, 'CyclfuX9yXeL6012G4Ns', '2025-05-15T15:32:05.003Z', '2026-06-14T00:37:18.976Z'),
('35b9922d-e8ae-4924-92d9-8e5ff93d1ade', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-01-04', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"DISTINCTION DIVINE ","messageSource":"APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":30,"women":43},"children":{"boys":10,"girls":12},"served":{"men":14,"women":17},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":95,"totalNewMembers":0}'::jsonb, '⁠  ⁠Pas de nouveau à ce culte 
•⁠  ⁠⁠Son trop fort dans la salle 
•⁠  ⁠⁠les chantres étaient en paire de baskets / dress code inadapté 
', NULL, 'DOJkUoS4AnyAecNCqYEp', '2026-02-17T11:57:37.810Z', '2026-06-14T00:37:19.119Z'),
('cec72c6e-0364-4422-8cdb-ffaa9d039ca4', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-04-25', '6985bfef-b10d-4483-b032-7b3f8bde144f', 'Veillée de Prière', NULL, 'Inconnu (ancien système)', '{"messageTheme":"VEILLEE    LA PUISSANCE DE LA RESURRECTION  ","messageSource":"VEILLEE DE PRIERE 1","speakerName":"Pasteur Léonard WADJA","attendance":{"adults":{"men":27,"women":41},"blooms":0,"served":{"men":10,"women":13},"children":{"boys":6,"girls":5},"conversions":{"women":0,"men":0}},"newMembers":{"women":0,"men":0,"children":0,"blooms":0},"totalParticipants":79,"totalNewMembers":0}'::jsonb, 'Coupure  de courant 
-Affichage des versets lent 
-Bruit des enfants dans la salle 
-Le pianiste absent de son poste après la coupure de courant 
', NULL, 'DZxaBLHmfNE5hKBj8AbY', '2025-04-28T19:29:38.419Z', '2026-06-14T00:37:19.264Z'),
('8cbf331e-f9bc-4c66-b908-a5c5fcf24239', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-03-01', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"COMMENT PRIER SELON LA VOLONTE DE DIEU (SUITE)","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":41,"women":67},"children":{"boys":22,"girls":18},"served":{"men":20,"women":25},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":2,"women":2,"blooms":0,"children":0},"totalParticipants":148,"totalNewMembers":4}'::jsonb, '- Souci lors du lancement des goods news 
- Débordement global du culte de 34 min ', NULL, 'Dart05Q9rFN6h2PKbSCh', '2026-03-01T13:08:13.844Z', '2026-06-14T00:37:19.413Z'),
('0cbd6186-79f4-4259-9f46-724bb5de332c', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-12-14', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"QUE TON REGNE VIENNE SUITE","messageSource":"LA PRIERE QUI PRODUIT LA SURABONDANCE : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":41,"women":61},"children":{"boys":25,"girls":17},"served":{"men":25,"women":27},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":4,"blooms":0,"children":0},"totalParticipants":144,"totalNewMembers":4}'::jsonb, '•⁠  ⁠son bas au lancement de la vidéo du début du culte 
•⁠  ⁠Débordement de 20min 
•⁠  ⁠⁠Son du dirigeant bas en ligne 
•⁠  ⁠⁠la vidéo recap des baptême n’a pas été intégrée aux goods news malgré la transmission samedi 
•⁠  ⁠⁠la vidéo de mobilisation pour le programme Under The Trees a été intégrée aux goods news alors qu’elle devait passer au moment de la mobilisation pour le programme 
•⁠  ⁠⁠erreur de référence  dans l’affichage des versets 
', NULL, 'DeQaMX2EchVhGbBozpcb', '2025-12-18T12:15:44.437Z', '2025-12-18T12:15:44.437Z'),
('2625aff2-9126-4a83-a3b8-33f654246b86', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-12-28', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"L’ACTION DE GRÂCES","messageSource":"APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":44,"women":68},"children":{"boys":19,"girls":19},"served":{"men":27,"women":23},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":1,"women":4,"blooms":0,"children":0},"totalParticipants":150,"totalNewMembers":5}'::jsonb, '-Son trop élevé  dans la salle 
  -Debordement global de 20 mn 
-Le Pasteur est monté en retard
-Problèmes de sons : le son s’entrecoupe  
-Son du micro baladeur du Pasteur lourd 
-Absence de certains portiers du service 
-Problèmes de sons pendant la diffusion de la vidéo recap du réveillon 
-L’oreillette du dirigeant ne fonctionnait pas 
', NULL, 'Efxfcptkoj3ewHk7E2MN', '2026-02-17T11:54:16.624Z', '2026-06-14T00:37:19.578Z'),
('a39a724e-8526-4b7b-a05c-3aeefdb5938c', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-05-10', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"2E CULTE: LE PAIN QUOTIDIEN ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":32,"women":51},"children":{"boys":22,"girls":22},"served":{"men":18,"women":24},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":127,"totalNewMembers":0}'::jsonb, 'Point des véhicules : 15
Voitures : 13
Motos : 2
Observations : 
-Débordement de 20 minutes du au temps de la prédication 
- Serviteurs qui mâche du shewing gum et mauvaise posture dans l’ensemble (lunette de soleil et mal assis durant le culte (elysé Benian  )
- Serviteur Qui dorment (elysé Benian) et Eric (portier) (Ize Dine Boukari porteur de vie)', NULL, 'FpbbulZuofvTqb9c6tRa', '2026-05-10T14:16:22.192Z', '2026-05-10T16:51:05.166Z'),
('2bb23956-d66b-4025-b7af-9761e85722b3', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-10-15', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"LA FOI ","messageSource":"LES  5 DETERMINANTS DE LA FOI ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":10,"women":14},"children":{"boys":3,"girls":4},"served":{"men":9,"women":9},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":31,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Problème avec les micros des chantres au début de l’adoration 
•⁠  ⁠Absence de portiers au culte 
', NULL, 'Fvz22ugAoAgOKl2zrOeg', '2025-10-22T16:31:36.262Z', '2025-10-22T16:31:36.262Z'),
('d7524999-13ce-4426-a689-f6bff441c3f1', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-07-09', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"MA MAISON SERA APPELEE UNE MAISON MAISON DE PRIERE ","messageSource":"Apôtre Mohamed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":18,"women":20},"children":{"boys":0,"girls":1},"served":{"men":14,"women":15},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":39,"totalNewMembers":0}'::jsonb, 'Véhicules : 10
Voitures : 9
Motos : 1

Observations : 
Le portier en charge des offrandes mache du chewing-gum pendant son service. 
Débordement global du culte : 22 minutes
Débordement de la prédication : 24minutes
', NULL, 'G7M98C3WIq8LD3dEFNY7', '2026-07-09T05:45:45.867Z', '2026-07-14T13:04:18.668Z'),
('1bbc1678-2359-49bb-ae93-2ce2b3a3c2eb', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-09-07', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LES DIFFERENTES FORMES DE PRIERES","messageSource":"Apprends-moi à prier: Apôtre MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":26,"women":49},"served":{"women":19,"men":13},"children":{"girls":9,"boys":17},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"blooms":0,"women":2,"children":0,"men":2},"totalParticipants":101,"totalNewMembers":4}'::jsonb, '•⁠  ⁠Problème sur la qualité du son du direct
•⁠  ⁠Problème de son (micro du pasteur qui siffle ) 
-Mauvaise prise en main du micro par la dirigeante (cela a déformé son son ) 
-Mauvaise posture de la personne en charge de l’accueil des nouveaux 

Points de suivi 

•⁠  ⁠L’électricien doit également vérifier les leds côté batterie ( À faire )
•⁠  ⁠Entretien cette semaine à faire pour éradiquer les moustiques (À faire ) 
', NULL, 'GAu3VflbyajD7QZCra8p', '2025-09-07T14:35:10.804Z', '2026-06-14T00:37:19.718Z'),
('2f004f21-7637-4d95-80b1-e12bb097d1a7', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-04-19', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"2E CULTE: CHERCHER DIEU ET NON LES SOLUTIONS DE DIEU (PARTIE 2)","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":32,"women":59},"children":{"boys":15,"girls":24},"served":{"men":17,"women":25},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":2,"women":0,"blooms":0,"children":0},"totalParticipants":130,"totalNewMembers":2}'::jsonb, 'Point des véhicules : 
Voitures : 15
Motos : 2

Observation: 
- Souci avec les télés au lancement des vidéos du tour 931
- Débordement de 38min 
', NULL, 'GCv6KJjHOMG73so4sATG', '2026-04-19T14:41:12.829Z', '2026-06-14T00:37:19.887Z'),
('d221cdad-7bfa-450f-918c-a9aa5a829e4c', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-10-26', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"LA PRIERE D''INTERCESSION ","messageSource":"Apprends-moi prier : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":31,"women":50},"children":{"boys":15,"girls":10},"served":{"men":15,"women":20},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":1,"women":1,"blooms":0,"children":0},"totalParticipants":106,"totalNewMembers":2}'::jsonb, '-Débordement global de 07 mn 
-Usage des radios 
-Les autres départements n’ont pas été briefés sur le déroulement de l’instant CJS 
', '-Les fiches de recensement des âmes qui donnent leurs vies à Jésus sont finies : besoin à remonter à tata Blanche pour récupérer au siège 
-Prévoir d’acheter des parapluies pour l’église : Tata Blanche 
', 'GRpRCNQse0yKlweJavC9', '2025-10-29T08:52:10.061Z', '2025-10-29T08:52:10.061Z'),
('24df545d-a221-431b-a25f-22e074da8a15', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-04-29', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"ENTRER DANS UNE SAISON DE MATURITÉ (SUITE)","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":24,"women":33},"children":{"boys":3,"girls":3},"served":{"men":19,"women":16},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":63,"totalNewMembers":0}'::jsonb, 'Souci de son au lancement de la vidéo de proclamation
- Souci de son pendant les good news 
- Débordement de 19min', NULL, 'HGO5loECDC0sqfIlNim3', '2026-04-30T05:42:54.633Z', '2026-06-14T00:37:20.030Z'),
('15c19031-b429-450d-9d31-dda697eb602d', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-09-26', '9bf2d72a-c692-40ed-8c9b-8ff60986fb95', 'Matinale de Prières', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA PRIERE DE SUPPLICATION","messageSource":"APPRENDS-MOI A PRIER: APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"women":8,"men":18},"blooms":0,"served":{"men":0,"women":0},"children":{"boys":0,"girls":0},"conversions":{"men":0,"women":0}},"newMembers":{"blooms":0,"women":0,"men":0,"children":0},"totalParticipants":26,"totalNewMembers":0}'::jsonb, NULL, NULL, 'Hz2u8DyogN3Upfo4Y8H7', '2025-09-26T11:36:32.433Z', '2026-06-14T00:37:20.170Z'),
('b6147bbb-9f8a-4d72-9252-88ba82e398dd', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-07-05', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"1ER CULTE : PARDONNER POUR ÊTRE  EXAUCÉ.E (SUITE) ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":23,"women":34},"children":{"boys":3,"girls":4},"served":{"men":13,"women":18},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":64,"totalNewMembers":0}'::jsonb, 'Point des véhicules : 9
Voitures : 8
Motos : 1

Observations : 
- Retard dans le lancement du culte et pas de vidéo de proclamation : souci avec la com (souci avec un écran et leur clavier) et le dirigeant n’était pas prêt 
- Pas de lien pour le direct 
- Son du micro du pasteur faible 
- Débordement de la prédication de 19min 
- Souci de son et d’affichage pendant les good news 
- Débordement global de 8min', NULL, 'IFUhLVH733sKqmtlnCJF', '2026-07-05T13:16:18.462Z', '2026-07-05T13:16:18.462Z'),
('c5f8d3c5-b9b8-42fd-8d22-171f3178e2cb', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-06-21', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"1ER CULTE : PARDONNER POUR ÊTRE EXAUCER","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":17,"women":29},"children":{"boys":4,"girls":3},"served":{"men":16,"women":24},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":53,"totalNewMembers":0}'::jsonb, 'Point des Véhicules: 7
Voiture : 6
Moto: 1

Observations : 

	⁃	Débordement de 3 minutes pour la prière du dirigeant 
	⁃	Téléphone du serviteur Elysée Benian qui a sonné durant la prédication 
	⁃	Débordement de 3min pour la prédication
	⁃	 Débordement global de 1 minute pour le culte 
	⁃	Rapport des véhicules non effectués par la logistique 
	⁃	Lien du culte non publié par la com
', NULL, 'IctfvHxS3QsixS6YvNnU', '2026-06-21T12:25:15.400Z', '2026-06-21T12:25:15.400Z'),
('ea8bf60a-64c8-4954-948e-ec78832d13fa', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-11-02', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"ACTION DE GRACES","messageSource":"Message migration Pasteur CAK ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":33,"women":48},"children":{"boys":21,"girls":15},"served":{"men":22,"women":0},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"women":1,"men":1,"blooms":0,"children":0},"totalParticipants":117,"totalNewMembers":2}'::jsonb, '•⁠  ⁠Problème de son du micro du pasteur sur YouTube 
•⁠  ⁠Erreur sur la vidéo du parcours 
•⁠  ⁠Bruit de fond au début de la vidéo de prédication 
•⁠  ⁠Absence de PH dans les toilettes
•⁠  ⁠Omission de l’appel à conversion 
•⁠  ⁠Les portiers tenaient mal les paniers
•⁠  ⁠Formation de Respo Mathias n’a pas été suivi : elles sont restées devant avec les offrandes pendant toute la durée des good News 
•⁠  ⁠Application de la formation 
•⁠  ⁠Le bébé qui faisait trop de bruit 
•⁠  ⁠Erreur sur le nom de maman Sezan et c’est écrit Respo Sery au lieu de Ap Sery ', NULL, 'IenzbN0BUMzhOoGwp2TA', '2025-11-13T15:45:14.084Z', '2025-11-13T15:46:36.604Z'),
('429bdb1f-c9e5-4d5e-be10-655735c6ecda', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-06-28', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"1ER CULTE: PARDONNER POUR ÊTRE  EXAUCÉ.E","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"women":37,"men":25},"served":{"men":12,"women":20},"conversions":{"men":0,"women":0},"blooms":0,"children":{"girls":4,"boys":4}},"newMembers":{"blooms":0,"children":0,"men":1,"women":1},"totalParticipants":70,"totalNewMembers":2}'::jsonb, 'Point des véhicules : 14
Voitures : 13
Motos : 1

Observations : 
- Retard dans le lancement du culte 
- Le compteur a sauté 
- La télé de l’ecodim des grands a un souci de câble
- Débordement de 28min
', NULL, 'J3e9XP2mkOBh9MQmHyXe', '2026-06-28T11:04:35.125Z', '2026-06-28T14:12:33.239Z'),
('a95956b3-d1ed-4f23-8be3-19e6816302ab', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-07-15', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"UNE MAISON DE PRIÈRE","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":18,"women":24},"children":{"boys":1,"girls":0},"served":{"men":11,"women":8},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":43,"totalNewMembers":0}'::jsonb, '
Observations : 
- Retard de 8min dans le lancement du culte dû à un souci avec la com : Ordinateur défaillant 
- Pas de lien pour le direct 
- Souci d’affichage pendant les good news 
- Débordement global de 22min', NULL, 'JNSFrJZsdXmh3OKYqd0u', '2026-07-16T16:23:12.493Z', '2026-07-16T16:23:12.493Z'),
('03c52141-7309-40e0-9900-9c637ecffb0e', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-06-28', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"2ECULTE : PARDONNER ÊTRE POUR ÊTRE EXAUCÉ","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":20,"women":45},"children":{"boys":10,"girls":10},"served":{"men":14,"women":22},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":2,"women":1,"blooms":0,"children":0},"totalParticipants":85,"totalNewMembers":3}'::jsonb, 'Point des Véhicules: 13
Voiture : 12
Moto: 1

	⁃	Culte débuté avec 25min de retard 
	⁃	Débordement de 22 min pour la prédication 
	⁃	Débordement de 3minutes pour le culte 
	⁃ Coupure d’électricité 
	⁃	Distraction de quelques membres du groupe musical ( beaucoup d’allez et retour pendant le culte)
	⁃	3 nouveaux (2 Garçons & une fille )
- Pas de prière de serviteur
', NULL, 'JZPE80nAq4El5EFh60uy', '2026-06-28T14:10:22.445Z', '2026-06-28T14:13:14.672Z'),
('c9112034-d43b-4ec9-af14-f2f1612bf466', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-05-10', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"1ER CULTE : LE PAIN QUOTIDIEN (SUITE)  ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":28,"women":39},"children":{"boys":4,"girls":6},"served":{"men":17,"women":23},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":1,"women":0,"blooms":0,"children":0},"totalParticipants":77,"totalNewMembers":1}'::jsonb, 'Point des véhicules : 15
Voitures : 13
Motos : 2

Toujours prévoir un micro au cas où un intervenant doit passer, parce qu’on est obligé de faire descendre une chantre pour récupérer son micro 
- Système d’alarme de sécurité activé en raison des portes fermées avec force 
- Débordement de 12min 
', NULL, 'KSsz4qyqi0A2jXjp4mSL', '2026-05-10T11:10:02.705Z', '2026-05-10T16:55:05.984Z'),
('4c4f2bd1-941b-410b-9387-3b16cc25e274', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-06-29', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"MAITRISEZ LES SUJETS DE PRIERE QUI OUVRENT LE CIEL","messageSource":"Apprends-moi à Prier: Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"blooms":0,"adults":{"women":54,"men":34},"served":{"men":17,"women":22},"conversions":{"women":0,"men":0},"children":{"boys":18,"girls":13}},"newMembers":{"children":0,"blooms":0,"men":1,"women":3},"totalParticipants":119,"totalNewMembers":4}'::jsonb, '•⁠  ⁠Débordement du message de 15 mn
•⁠  ⁠Débordement global de 7 mn 

Points de suivi 
•⁠  ⁠L’électricien doit également vérifier les leds côté batterie ( À faire mardi )
•⁠  ⁠Écouteurs à mettre à disposition pour le pianiste (À faire cette semaine) 
•⁠  ⁠Entretien cette semaine à faire pour éradiquer les moustiques (À faire cette semaine) 
', NULL, 'LBMr479lcTjLBjhB82MW', '2025-06-29T14:55:02.943Z', '2026-06-14T00:37:20.306Z'),
('235b3427-92c9-4466-8553-dd5fdd56699e', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-05-31', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"2 CULTE: PÈRE APPREND MOI À BIEN TE DEMANDER ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":44,"women":71},"children":{"boys":30,"girls":23},"served":{"men":16,"women":25},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":3,"women":3,"blooms":0,"children":1},"totalParticipants":168,"totalNewMembers":7}'::jsonb, 'Point des Véhicules: 23
Voiture : 22
Moto: 1

Observations :
- Cleaning non effectué par la famille de service dans la salle pour le 2e culte 
- L’instant fête des mères a cumulé un débordement de 17 minutes 
- 7 nouveaux (  3 hommes, 3 femmes et 1 bb)
- Débordement global de 29 minutes du a l’instant fête des mères.
- ⁠Cleaning non effectué par la logistique ', NULL, 'LJfL00VM6m7mtQPtAotg', '2026-05-31T14:55:28.903Z', '2026-05-31T14:55:28.903Z'),
('f427d8bf-74d9-413d-878a-17669e693141', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-01-28', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"QUI SERA CONTRE TOI ? ","messageSource":"APOTRE MOHAMMED SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":18,"women":25},"children":{"boys":3,"girls":4},"served":{"men":6,"women":6},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":50,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Débordement de 10min
', NULL, 'LV1kN13FHh2Bd8kOZ5vR', '2026-02-17T12:50:55.249Z', '2026-06-14T00:37:20.473Z'),
('a0c7937a-4c6d-4fd3-b2ce-c3b28daa3266', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-06-21', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"2E CULTE: PARDONNER POUR ETRE EXAUCÉ (SUITE)","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":30,"women":61},"children":{"boys":14,"girls":12},"served":{"men":14,"women":23},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":2,"women":1,"blooms":0,"children":0},"totalParticipants":117,"totalNewMembers":3}'::jsonb, 'Point des véhicules : 12
Voitures : 11
Moto : 1

Observations : 

- 2 minutes de retard dans le lancement du culte
- Déconcentration des serviteurs (connectés sur les réseaux sociaux Grace khalil et Delima)  
- Distraction du groupe musical pendant le culte( hors de la salle pour causerie)
- Souci de son avec le micro de la dirigeante à la sainte cène 
- La baladeuse du pasteur était toujours active après la prédication et jusqu’à la fin du culte 
- ⁠la com n''as pas installé la télé au niveau de ADN
- Débordement global de 4 minutes ', NULL, 'MFQOkcKiVAQ3SMICWzGV', '2026-06-21T13:59:07.152Z', '2026-06-21T17:12:24.597Z'),
('1518ce1a-d65e-49df-80a9-4efbfc9c4fee', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-04-26', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"1ER CULTE: COMMENT METTRE EN PRIORITÉ LE SALUT DES ÂMES ","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":33,"women":54},"children":{"boys":6,"girls":6},"served":{"men":18,"women":26},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"children":0,"blooms":0,"men":0,"women":1},"totalParticipants":99,"totalNewMembers":1}'::jsonb, 'Souci de son pendant la vidéo de proclamation 
- Débordement de 22 min 

Point des véhicules : 14 
Voitures : 13
Moto : 1', NULL, 'MKtZUgMVw29ZtqbrKYGo', '2026-04-26T12:33:33.704Z', '2026-06-14T00:37:20.612Z'),
('03e53cb9-3ccd-45a7-836a-737640d180d0', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-03-23', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"PLUS QUE VAINQUEUR","messageSource":"Mentalité de conquérant: Pasteur Mohammed SANOGO.","speakerName":"Pasteur Wilfried SEZAN","attendance":{"conversions":{"women":0,"men":0},"served":{"women":15,"men":8},"children":{"girls":14,"boys":13},"blooms":0,"adults":{"women":53,"men":22}},"newMembers":{"blooms":0,"women":9,"men":2,"children":0},"totalParticipants":102,"totalNewMembers":11}'::jsonb, '- Débordement de 13 mn 
- Son du micro du dirigeant (léger écho) 
- Bip de l’afficheur à mettre off 
- Distribution de la sainte cène en retard 
- Avoir une équipe dehors pour « anakagzo » entre le lancement du culte et le début de la prédication 

À vérifier 
- Télécommande Ecodim défaillant : Respo  Valentin 
- Senteurs des toilettes à poser sur un meuble pour éviter l’accès aux enfants : Respo Blanche 
- Réparer la table de réception des nouveaux : Respo Blanche 

À planifier 
- Convoi C Pâques : planifier pour les plénières au stade de l’université . Intégrer dans les annonces / Valentin sera en charge convoi 
- Une veillée des serviteurs à préparer : 04  Avril 
- Les rdv des champions débuteront en avril : organiser une réunion d’organisation le Dimanche 30 après le culte / Chaque département doit se préparer / Le Pasteur confirmera la date de début.
', NULL, 'ML9MGdFGjXB3K6Dim7kE', '2025-03-24T10:46:08.144Z', '2026-06-14T00:37:20.750Z'),
('82f18147-15ff-4d82-b4d9-048a20b0c764', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-01-21', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"COMMENT ALLER 0 REHOBOTH SUITE","messageSource":"APOTRE MOHAMMED SANOGO","speakerName":"AP CHRISTIAN ","attendance":{"adults":{"men":14,"women":21},"children":{"boys":1,"girls":1},"served":{"men":8,"women":6},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":37,"totalNewMembers":0}'::jsonb, NULL, NULL, 'MLCp3p9skv5ScgdMq7IE', '2026-02-17T12:35:19.020Z', '2026-06-14T00:37:20.886Z'),
('e1a20b69-d349-4864-b46d-7a673feb43db', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-02-11', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LES CLÉS POUR TRIOMPHER PAR LA PUISSANCE DIVINE ","messageSource":"APOTRE MOHAMMED SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":18,"women":22},"children":{"boys":3,"girls":4},"served":{"men":14,"women":17},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":47,"totalNewMembers":0}'::jsonb, 'Retard de tous les instrumentistes 
•⁠  ⁠Un téléphone a sonné à la com pendant la prédication 
•⁠  ⁠Débordement de 18min 
', NULL, 'MUc4Hi7JQtdgDqYfyMgi', '2026-02-17T13:11:07.340Z', '2026-06-14T00:37:21.024Z'),
('734ec6db-2ed1-4505-adad-9797dbd97b8a', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-05-12', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"LE GRAND SECRET DES COUPLES ÉPANOUIS ET COMPLICES ","messageSource":"Apôtre Mohammed SANOGI","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":20,"women":26},"children":{"boys":1,"girls":0},"served":{"men":8,"women":7},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":47,"totalNewMembers":0}'::jsonb, 'Point des véhicules : 10
Voitures : 7
Motos : 3

Observations :
- Interférence de son pendant l’intervention du pasteur 
- Débordement de 1h10min', NULL, 'MYLjYPJ6aqUnJv39mc1C', '2026-05-13T16:27:54.459Z', '2026-05-13T16:27:54.459Z'),
('f4f0a7a6-3e57-4af7-b938-0d051d6de75e', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-06-16', '645cea6d-2969-47c8-9e61-c0ec50f3518e', 'JEUNE ET PRIERE ', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"JOUR 2 JEUNE ET PRIERE: SEIGNEUR,RÉPANDS SUR NOUS UN ESPRIT DE PRIÈRE ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":13,"women":18},"children":{"boys":0,"girls":0},"served":{"men":11,"women":16},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":31,"totalNewMembers":0}'::jsonb, 'Point des véhicules : 10
Voitures : 10
Motos : 0

Observations: 
	⁃	Débordement de 30minutes durant la prédication du pasteur 
	⁃	Débordement global du culte de 25minutes', NULL, 'Miuu2Q4302vszCcEocwF', '2026-06-17T11:18:53.291Z', '2026-06-17T11:18:53.291Z'),
('2d199d3f-a1e7-4f41-9b21-63292ea9bc87', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-09-24', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LE TYPE DE PENSEES QUI DONNENT UNE FORTE ESPERANCE ","messageSource":"LES 7 DETERMINANTS DE LA FOI","speakerName":"Pasteur Wilfried SEZAN","attendance":{"children":{"girls":3,"boys":3},"conversions":{"women":0,"men":0},"served":{"men":8,"women":9},"adults":{"women":17,"men":13},"blooms":0},"newMembers":{"women":0,"men":0,"blooms":0,"children":0},"totalParticipants":36,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Gestion des cultes en retard 
•⁠  ⁠Débordement global de 24 mn
', NULL, 'N1qvzrNZkvxlGNNzUnTS', '2025-09-25T18:19:12.305Z', '2026-06-14T00:37:21.162Z'),
('5f6c56da-0885-491a-af29-efa522164b27', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-06-19', '645cea6d-2969-47c8-9e61-c0ec50f3518e', 'JEUNE ET PRIERE ', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"JOUR 5: SEIGNEUR PAR TOI JE TRIOMPHE DE L’ESPRIT D’AMALEK EN GARDANT MES MAINS LEVÉES","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":12,"women":14},"children":{"boys":0,"girls":0},"served":{"men":10,"women":11},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":26,"totalNewMembers":0}'::jsonb, 'Point des véhicules : 8
Voitures : 8
Motos : 0

Observations: 
	⁃	son faible dans le micro du dirigeant lors du début de la prière.
	⁃	culte débuté avec 1minute de retard 
	⁃	Débordement de 2 minutes pour la prière du dirigeant 
	⁃	Débordement de 43 minutes pour la prédication du pasteur 
	⁃	Débordement global de 44 minutes pour le culte ', NULL, 'NJSfbebdYhXEhaST2GAP', '2026-06-19T21:58:27.863Z', '2026-06-19T21:58:27.863Z'),
('a5c4073e-f66a-49a5-8be8-b1c9c90cdb2b', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-01-05', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"BÉNÉDICTIONS POUR UN CIEL OUVERT: LES 3 TYPES D''ASCENSIONS","messageSource":"Message du Premier Dimanche de l''année","speakerName":"Apôtre Mohammed SANOGO","attendance":{"served":{"women":10,"men":8},"blooms":0,"conversions":{},"adults":{"women":19,"men":18},"children":{"boys":2,"girls":3}},"newMembers":{"children":0,"blooms":0,"men":2,"women":3},"totalParticipants":42,"totalNewMembers":5}'::jsonb, '- Lenteur dans les affichages des versets au niveau de la Comm;
- Température élever dans la salle;
- Chant de l''accueil des nouveaux perturbé par la melodie du pianiste; 
- Débordement globale de 20 mn du Pasteur;
- les serviteurs doivent soutenir les intervenants, acclamations... 

', NULL, 'Ox9Q17WvuXoFDNydb2Fa', '2025-01-05T21:16:36.895Z', '2026-06-14T00:37:21.297Z'),
('0bc97b35-6377-474d-a2fc-56ed3026de20', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-08-10', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LES BONNES HABITUDES A AVOIR POUR PRIER EFFICACEMENT","messageSource":"APPRENDS-MOI A PRIER : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"children":{"boys":20,"girls":7},"blooms":0,"conversions":{"women":0,"men":0},"served":{"women":18,"men":16},"adults":{"women":53,"men":37}},"newMembers":{"women":4,"children":0,"blooms":0,"men":5},"totalParticipants":117,"totalNewMembers":9}'::jsonb, '•⁠  ⁠un problème au niveau de l’affichage du verset au niveau de la COM
•⁠  ⁠Problème de sons sur les retours;', NULL, 'PkAGKekYr3EvS75xn5ZD', '2025-08-10T13:51:33.867Z', '2026-06-14T00:37:21.436Z'),
('56176170-126e-4004-98e0-ff18191a21c9', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-06-25', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"QUAND LA CORRECTION MENE DANS LE REPOS","messageSource":"réussir sa vie par la sagesse divine: Jour 20 Accepte la correction","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":15,"women":26},"blooms":0,"children":{"boys":3,"girls":6},"conversions":{"men":0,"women":0},"served":{"women":12,"men":9}},"newMembers":{"blooms":0,"women":0,"children":0,"men":0},"totalParticipants":50,"totalNewMembers":0}'::jsonb, NULL, NULL, 'Qj7qT20FNxV1BePtk0HU', '2025-06-26T15:28:23.166Z', '2026-06-14T00:37:21.576Z'),
('37255aa0-dae3-4b2a-ac24-1536dcbd7f99', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-07-06', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"CULTE SPECIAL DE MIGRATION A MH : LA SAGESSE DU REPOS","messageSource":"les 7 colonnes de la sagesse. ","speakerName":"Pasteur Thierry N''DOUFOU","attendance":{"adults":{"men":56,"women":74},"blooms":0,"served":{"men":20,"women":24},"conversions":{"women":1,"men":0},"children":{"girls":13,"boys":17}},"newMembers":{"women":7,"men":5,"blooms":0,"children":0},"totalParticipants":160,"totalNewMembers":12}'::jsonb, NULL, NULL, 'SNvG1ZFbmOsFTGADrDQa', '2025-07-08T04:53:56.094Z', '2026-06-14T00:37:21.716Z'),
('8eb22030-a038-4270-87ff-f4db9963431c', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-08-13', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA FOI DU GRAIN DE SENEVE","messageSource":"Les 5 Déterminants de la Foi : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"children":{"girls":5,"boys":4},"adults":{"men":22,"women":22},"conversions":{"men":0,"women":0},"served":{"men":8,"women":0},"blooms":0},"newMembers":{"men":0,"blooms":0,"women":0,"children":0},"totalParticipants":45,"totalNewMembers":0}'::jsonb, NULL, NULL, 'SQMyyEkoobRXWnwKNJA0', '2025-08-14T13:50:59.271Z', '2026-06-14T00:37:21.853Z'),
('367d1baf-533d-4ae4-858c-8e1e6f9c516d', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-03-31', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', NULL, 'Inconnu (ancien système)', '{"messageTheme":"GUERIR DES BLESSURES EMOTIONNELLES ","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":18,"women":19},"children":{"boys":1,"girls":0},"served":{"men":15,"women":14},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":38,"totalNewMembers":0}'::jsonb, 'Un débordement global de temps de 1h04 a été constaté, principalement dû au retard de l''installation de la comm et à la durée de l''intervention du pasteur', NULL, 'TA4Lf5DtbKt7S5TnCrwA', '2026-04-01T19:43:31.047Z', '2026-06-14T00:37:21.987Z'),
('907ad504-8c6c-4237-a330-93641928280d', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-05-18', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"POURQUOI PRIER ?","messageSource":"Apprends-moi à prier : APOTRE MOHAMMED SANOGO. ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"served":{"men":15,"women":19},"conversions":{"women":1,"men":2},"children":{"boys":19,"girls":14},"blooms":0,"adults":{"women":55,"men":34}},"newMembers":{"children":0,"men":5,"blooms":0,"women":5},"totalParticipants":122,"totalNewMembers":10}'::jsonb, NULL, NULL, 'TE62UWBQ1Ib4oRCq8ZPz', '2025-05-18T19:12:22.465Z', '2026-06-14T00:37:22.126Z'),
('67184362-581b-4dd1-8569-a2619ad00c7a', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-05-17', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"2E CULTE : LE PAIN QUOTIDIEN : PAPA APPREND MOI À BIEN DEMANDER ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":35,"women":69},"children":{"boys":26,"girls":24},"served":{"men":19,"women":26},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":3,"blooms":0,"children":1},"totalParticipants":154,"totalNewMembers":4}'::jsonb, 'Point des véhicules : 18
Voitures : 17
Moto : 1

Observations : 
- Débordement de 23min 
- Le récap du séminaire n’était pas sur le timing ', NULL, 'TSWEYgswY02N180H9pPm', '2026-05-17T13:42:22.314Z', '2026-05-17T13:42:22.314Z'),
('b95d792c-baca-4f83-ad1e-c8a631117eb1', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-11-26', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"COMMENT SE PRIVE-T-ON DE LA GRACE DE DIEU.. ","messageSource":"APOTRE MOHAMMED SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":21,"women":26},"children":{"boys":5,"girls":5},"served":{"men":11,"women":8},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":57,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Débordement global 24 mn
•⁠  ⁠Lenteur affichage des versets 
•⁠  ⁠Son des chantres fort 
', NULL, 'TwlGitV1igZaWZLg935X', '2025-12-02T10:13:25.661Z', '2025-12-02T10:13:25.661Z'),
('4a0a7507-7287-433a-bda7-be0fd2188bba', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-06-22', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"ÉQUIPÉS POUR MOISSONNER ","messageSource":"CULTE DE FIN DE TOUR 931 BOUAKE ","speakerName":"Apôtre Mohammed SANOGO","attendance":{"conversions":{"men":0,"women":0},"served":{"men":16,"women":17},"children":{"girls":12,"boys":21},"blooms":11,"adults":{"men":26,"women":45}},"newMembers":{"blooms":0,"women":5,"children":0,"men":3},"totalParticipants":115,"totalNewMembers":8}'::jsonb, 'Coupure d’électricité : problème avec un câble ==== un électricien doit venir pour vérifier 
•⁠  ⁠L’électricien doit également vérifier les leds côté batterie 
•⁠  ⁠Débordement global du culte de 13 mn 
•⁠  ⁠Problèmes avec le micro du dirigeant  : test micro à faire 
•⁠  ⁠Son dans la salle fort et problèmes de sons dans la salle 
•⁠  ⁠Écouteurs à mettre à disposition pour le pianiste. 
•⁠  ⁠Entretien cette semaine à faire pour éradiquer les moustiques : tata Blanche ', NULL, 'Ul6p1ZcfQWzsHr3UF3EL', '2025-06-23T12:00:14.037Z', '2026-06-14T00:37:22.262Z'),
('8d7cd2cc-7af1-4772-99ea-eca14ca399fc', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-05-03', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"1ER CULTE : LE PAIN QUOTIDIEN ","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":28,"women":55},"children":{"boys":7,"girls":4},"served":{"men":25,"women":30},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":2,"blooms":0,"women":8,"children":0},"totalParticipants":94,"totalNewMembers":10}'::jsonb, 'Point des véhicules : 15
Voitures : 13
Motos : 2

Observations : 
- Interférence de son pendant la prière de la dirigeante 
- Grésillement à la montée du pasteur 
- Débordement de 9min 

', NULL, 'V0ITh9x9nMRGxbMSEabP', '2026-05-03T12:01:34.212Z', '2026-05-03T23:33:26.367Z'),
('3947f909-016e-40f5-bcc3-66353339addb', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-07-08', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"HOMME FEMME  DES DIFFÉRENCES À NE PAS PRENDRE À LA LÉGÈRE.","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":16,"women":20},"children":{"boys":1,"girls":1},"served":{"men":12,"women":17},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":38,"totalNewMembers":0}'::jsonb, 'Point Véhicules : 9
Voitures: 8
Motos: 1

Observation:
	⁃	Débordement de 24 minutes pour l’intervention du pasteur 
	⁃	Débordement global de 14 minutes pour le culte', NULL, 'VC9zjjYcSmC7SNmAS58C', '2026-07-08T11:31:54.782Z', '2026-07-08T11:31:54.782Z'),
('d79bc7d8-65c0-446a-9d37-7a18010156af', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-06-07', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"1ER CULTE: PÈRE APPREND MOI À BIEN TE DEMANDER ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":26,"women":45},"children":{"boys":6,"girls":3},"served":{"men":24,"women":27},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":2,"blooms":0,"children":0},"totalParticipants":80,"totalNewMembers":2}'::jsonb, 'Point des Véhicules: 15
Voiture : 13
Moto: 12

Observations :

1. Téléphone d’un porteur de vie qui a sonné pendant le culte en pleine prédication.

2. Assez de va et vient des serviteurs observé dans la salle en pleine prédication ne dépendant pas dans la majeure partie des cas du service sont concernés : Accueil et serviteurs porteurs de vie.

3. chuchotements,rires récurrent entre les 3 dames de la com en service durant la prédication malgré nos interpellations.

4. Absence de l’équipe chargée d’annoncer l’olympiade

5. Absence du serviteur en charge d’accueillir les nouveaux et remplacé par Fatou Ba

6. Culte terminé avec 8 minutes de retard 

7. Débordement de 30minutes pour la prédication ', NULL, 'VQwOFZWGbHvsydk6D7a5', '2026-06-07T10:44:13.756Z', '2026-06-07T10:44:13.756Z'),
('babcb430-98c7-4aa0-8cf2-c9996e100cda', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-07-02', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"LA TIÉDEUR SPIRITUELLE ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":15,"women":19},"children":{"boys":0,"girls":0},"served":{"men":12,"women":17},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":34,"totalNewMembers":0}'::jsonb, 'Observations.  
	⁃	Le téléphone d’un membre de la com a sonné pendant le culte.
	⁃	Débordement de 40minutes pour la prédication 
	⁃	débordement global de 35minutes

Véhicules :  7
Voitures: 6
Motos : 1', NULL, 'VVsB3TYgjHh17HAEhpON', '2026-07-02T21:53:54.494Z', '2026-07-02T21:53:54.494Z'),
('d8552627-7467-4a1f-8305-f45a4104920e', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-04-27', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA PAIX DE DIEU","messageSource":"REFLETE LA PAIX DIVINE : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"blooms":0,"children":{"girls":13,"boys":17},"adults":{"men":33,"women":42},"served":{"men":19,"women":15},"conversions":{"men":0,"women":0}},"newMembers":{"children":0,"men":1,"women":1,"blooms":0},"totalParticipants":105,"totalNewMembers":2}'::jsonb, 'Débordement du message de 15 mn 
•⁠  ⁠Logistique absente : Elisée est affecté à la logistique pour supporter le frère Valentin 
•⁠  ⁠Incident avec le frère alcoolique pendant le culte et en dehors 
•⁠  ⁠Retard affichage des versets : PC lent 
•⁠  ⁠Déco en charge du nettoyage des portes : produit à acheter 
•⁠  ⁠Mettre en place une trousse d’urgence pour les 1ers soins : tata Blanche 

À planifier 
 
•⁠  ⁠Les rdv des champions débuteront  le Mercredi 07 Mai / Chaque département doit se préparer', NULL, 'VqhqaxO8VF97R5AIkFYx', '2025-04-28T19:21:32.907Z', '2026-06-14T00:37:22.404Z'),
('1793b218-2446-4e63-8fc3-22115d36be3f', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-03-04', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LE FRUIT DE L''OBEISSANCE PARTIE 1 ","messageSource":"APOTRE MOHAMMED SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":15,"women":20},"children":{"boys":3,"girls":4},"served":{"men":13,"women":12},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":42,"totalNewMembers":0}'::jsonb, ' ⁠Son fort dans le micro du pasteur en ligne 
•⁠  ⁠Débordement de 15min 
', NULL, 'WI4QUL15kbtZgc2lRhjd', '2026-03-05T17:33:28.397Z', '2026-06-14T00:37:22.538Z'),
('7c9edf55-cbda-49ad-a0ff-726b6558b43b', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-08-03', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"DE LA PART DE... SUITE ","messageSource":"APPRENDS_MOI A PRIER : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":18,"women":40},"served":{"women":19,"men":12},"blooms":10,"conversions":{"women":0,"men":0},"children":{"boys":12,"girls":7}},"newMembers":{"blooms":0,"men":0,"women":0,"children":0},"totalParticipants":87,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Gestion des cultes en retard 
•⁠  ⁠Débordement global de 31 mn
•⁠  ⁠Mauvaise coordination de certains chants 
•⁠  ⁠Son fort dans la salle 
•⁠  ⁠Positionnement des portiers : les gens entraient dans le dos des portiers 

Points de suivi 
•⁠  ⁠L’électricien doit également vérifier les leds côté batterie ( À faire mardi )
•⁠  ⁠Écouteurs à mettre à disposition pour le pianiste (À faire cette semaine) 
•⁠  ⁠Entretien cette semaine à faire pour éradiquer les moustiques (À faire cette semaine) 
', NULL, 'YDvnxBqKrUMJTcjVXtCe', '2025-08-05T15:01:34.151Z', '2026-06-14T00:37:22.680Z'),
('055bcef1-b698-4260-b14f-d1d1b3e87222', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-04-01', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"CONSACRE POUR DIEU ","messageSource":"Pasteur Marcello ","speakerName":"PASTEUR MARCELO TUNASI","attendance":{"adults":{"men":18,"women":21},"children":{"boys":1,"girls":2},"served":{"men":14,"women":13},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":42,"totalNewMembers":0}'::jsonb, 'Débordement global de 20 minutes observé en raison du temps de modération
- ⁠Le dirigeant a servi en pantalon Jeans', NULL, 'YKjqqV5FeBXD1B87JjUF', '2026-04-02T14:41:16.350Z', '2026-06-14T00:37:22.817Z'),
('cc4a585c-0aa3-4c9b-82cb-0c79a60f35d2', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-07-12', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"2E CULTE: ALLER PLUS LOIN POUR PARDONNER ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":29,"women":65},"children":{"boys":23,"girls":15},"served":{"men":14,"women":24},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":2,"women":2,"blooms":0,"children":0},"totalParticipants":132,"totalNewMembers":4}'::jsonb, 'Point des Véhicules: 12
Voiture : 10
Moto: 2

Observations : 

	⁃	culte débuté avec un retard de 30min en raison du débordement du 1er culte
	⁃	la prière des bacheliers na pas été prise en compte dans le timing
	⁃	4 nouveaux ( 2hommes- 2femmes)
	⁃	Débordement global de 49 minutes 
	⁃	Débordement de 21 minutes pour la prédication pastorale 
', NULL, 'YM5avbxhdRODYf819tgE', '2026-07-12T14:13:07.858Z', '2026-07-12T14:13:07.858Z'),
('e75f3ff9-30c8-4a96-b150-07c909b340b3', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-06-04', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA SOIF DE DIEU","messageSource":"EFFUSION 2025 JOUR 1 APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"blooms":0,"conversions":{"men":0,"women":0},"adults":{"women":24,"men":21},"children":{"boys":7,"girls":6},"served":{"women":14,"men":17}},"newMembers":{"women":0,"blooms":0,"men":0,"children":0},"totalParticipants":58,"totalNewMembers":0}'::jsonb, '⁠  ⁠Retard de lancement du culte du à la com qui n’était pas prête 
•⁠  ⁠Le son était fort dans la salle sur la première partie du culte (avant montée du dirigeant ) 
•⁠  ⁠Débordement de 17 mn du message ', NULL, 'YWp2phZkMhsZTYi8sYzK', '2025-06-08T14:26:03.996Z', '2026-06-14T00:37:22.953Z'),
('38bc715e-6552-453d-8aca-00cdfe49efcf', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-07-05', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"2E CULTE: PARDONNER POUR ETRE EXAUCÉ.E (SUITE)","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":34,"women":64},"children":{"boys":23,"girls":13},"served":{"men":17,"women":22},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":2,"blooms":0,"children":0},"totalParticipants":134,"totalNewMembers":2}'::jsonb, 'Point des véhicules : 11
Voitures :10
Moto :1

Observations :  
- Retard dans le lancement du culte et pas de vidéo de proclamation : souci avec la com
	⁃	débordement de 2minutes pour le temps de prédication 
	⁃	Débordement de 29 minutes pour le temps global de prédication ', NULL, 'Z8en3YlXcxpNLFSIeWNP', '2026-07-05T13:57:59.830Z', '2026-07-05T13:57:59.830Z'),
('0b2cf08c-bb40-4ac3-b0b4-13ca131fee77', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-03-16', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"APPRENDRE À AIMER DIEU DE TOUTE SA FORCE","messageSource":"Torrent d''amour et de grâce. Apôtre mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"children":{"boys":7,"girls":7},"conversions":{"women":1,"men":0},"blooms":5,"served":{"men":13,"women":9},"adults":{"women":33,"men":26}},"newMembers":{"children":0,"men":3,"blooms":0,"women":2},"totalParticipants":78,"totalNewMembers":5}'::jsonb, '•⁠  ⁠12 mn de débordement
•⁠  ⁠Gestion des cultes absente de la salle au lancement du culte 
•⁠  ⁠Problèmes de son / Problèmes avec le micro du Pasteur / Pas de réaction de la gestion des cultes 
•⁠  ⁠Lenteur affichage des versets 
•⁠  ⁠Bip de l’afficheur à mettre off 
•⁠  ⁠Distribution de la sainte cène en retard 
•⁠  ⁠Avoir une équipe dehors pour « anakagzo » entre le lancement du culte et le début de la prédication 

À vérifier 
•⁠  ⁠Télécommande Ecodim défaillante : Respo  Valentin 
•⁠  ⁠Senteurs des toilettes à poser sur un meuble pour éviter l’accès aux enfants : Respo Blanche 
•⁠  ⁠Réparer la table de réception des nouveaux : Respo Blanche 
•⁠  ⁠Plinthe à réparer dans la salle : Respo Blanche 

À planifier 
•⁠  ⁠Convoi C Pâques : planifier pour les plénières au stade de l’université . Intégrer dans les annonces / Valentin sera en charge convoi 
•⁠  ⁠Une veillée des serviteurs à préparer : 04  Avril 
•⁠  ⁠Les rdv des champions débuteront en avril : Chaque département doit se préparer / Le Pasteur confirmera la date de début 
', NULL, 'ZRq0FOA5Xjxsnb460Nv1', '2025-03-17T11:18:38.320Z', '2026-06-14T00:37:23.094Z'),
('91042592-b062-43ad-8ef1-26b1d3d8ec1e', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-11-09', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"LE CODE SECRET DU ROYAUME : LA PRIERE DU NOTRE PERE ","messageSource":"APPRENDS-MOI A PRIER APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":30,"women":63},"children":{"boys":18,"girls":15},"served":{"men":27,"women":23},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":3,"women":1,"blooms":0,"children":0},"totalParticipants":126,"totalNewMembers":4}'::jsonb, '•⁠  ⁠Débordement global de 21 mn 
•⁠  ⁠Toilette des femmes sales 
•⁠  ⁠Problème avec micro de la lead au début du culte 
•⁠  ⁠Son pas le même au niveau de la sono  et dans la salle surtout à l’arrière 
•⁠  ⁠Caméra sombre à l’écran  
•⁠  ⁠Portier visible dans le champ de la caméra 
•⁠  ⁠mauvaise synchronisation des portiers au moment de repartir pour la prière 
', 'ENVELOPPE DE DIMES', 'aUP3Q3tQc95obsPOfJzC', '2025-11-13T16:06:54.683Z', '2025-11-13T16:06:54.683Z'),
('0240b520-2d1c-4695-8a16-d9d9544eb16d', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-05-07', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LES CHAMPIONS DE DIEU","messageSource":"Pleinement béni 12 : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"children":{"boys":4,"girls":5},"adults":{"women":25,"men":20},"conversions":{"men":0,"women":0},"blooms":0,"served":{"men":17,"women":11}},"newMembers":{"blooms":0,"children":0,"men":2,"women":0},"totalParticipants":54,"totalNewMembers":2}'::jsonb, NULL, NULL, 'aXLvWPt9w4bUTPyX3Y2m', '2025-05-08T11:40:04.103Z', '2026-06-14T00:37:23.230Z'),
('53cfefa8-eb8b-423b-a192-abdde6474029', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-11-19', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"RDV DEVANT LE TRONE DE LA GRACE ","messageSource":"APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":21,"women":25},"children":{"boys":2,"girls":2},"served":{"men":12,"women":9},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":50,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Le micro de la lead est très fort et les autres micros sont très bas donc avec les instruments on entendait quasiment pas leurs voix 
•⁠  ⁠Lenteur dans la projection de certains versets 
•⁠  ⁠Débordement de 20min 

Absence d''image au niveau du live  YouTube pendant plus de 30 mn. 
', NULL, 'awjbazh2A6p0xpoVTNHQ', '2025-11-21T14:20:38.086Z', '2025-11-21T14:20:38.086Z'),
('eda380cd-a5ad-48cf-9b47-1966617916c9', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-06-18', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"GARDER UN VIE DE MEDITATION STABLE (SUITE)","messageSource":"apôtre mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"children":{"boys":5,"girls":5},"adults":{"women":21,"men":13},"conversions":{"women":0,"men":0},"served":{"women":13,"men":11},"blooms":0},"newMembers":{"women":0,"blooms":0,"men":1,"children":0},"totalParticipants":44,"totalNewMembers":1}'::jsonb, '•⁠  ⁠Le son était fort dans la salle au lancement du culte 
•⁠  ⁠Le micro du dirigeant ne fonctionnait pas à sa montée 
•⁠  ⁠Débordement du temps de prière par le dirigeant 
•⁠  ⁠Débordement global de 13mn 
', NULL, 'bASE3DaacopCK5CZK4gl', '2025-06-19T14:40:02.053Z', '2026-06-14T00:37:23.369Z'),
('12f62e1b-40a7-4fe3-8974-bb1f0e8728b5', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-07-30', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LE MYSTÈRE DE LA FOI","messageSource":"LES 5 DETERMINANTS DE LA FOI : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"women":17,"men":11},"served":{"women":10,"men":10},"conversions":{"men":0,"women":0},"blooms":0,"children":{"girls":4,"boys":3}},"newMembers":{"children":0,"blooms":0,"women":0,"men":0},"totalParticipants":35,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Chantre en retard 
•⁠  ⁠Son de la lead fort 
•⁠  ⁠Coupure d’électricité à la fin du message 
•⁠  ⁠Débordement global de 20 mn
', NULL, 'bcg7mKuos3lZmScldtkW', '2025-08-05T14:55:04.728Z', '2026-06-14T00:37:23.515Z'),
('1c29a399-6b67-41ed-906b-81f88a983113', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-04-15', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA MANNE CESSA","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":15,"women":24},"children":{"boys":2,"girls":3},"served":{"men":12,"women":16},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":44,"totalNewMembers":0}'::jsonb, 'Souci de son au lancement de la vidéo de proclamation
- Son fort pendant l’adoration et son du micro de la dirigeante fort 
- Souci de son avec le micro en ligne 
- La dirigeante a dirigé en Jean 
- Débordement de 19min 
', NULL, 'bn9VCgWB03vHQHWgggOt', '2026-04-15T21:47:51.947Z', '2026-06-14T00:37:23.654Z'),
('f78593c1-afe6-44ae-96ed-71fed76cd2a7', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-09-17', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"COMMENT DEVELOPPER UNE FORTE ESPERANCE ","messageSource":"Les 5 déterminants de la Foi: Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":15,"women":18},"children":{"boys":5,"girls":5},"served":{"men":10,"women":11},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":43,"totalNewMembers":0}'::jsonb, 'Problème de son avec le micro du pasteur
Débordement du culte de 17 mn
', NULL, 'bvqYBhRML6bJf0AOt2Y2', '2025-09-17T21:19:27.048Z', '2026-06-14T00:37:23.792Z'),
('04834f9c-2e77-4b27-b4f1-0749312e4b1a', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-05-17', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"1ER CULTE : PAPA APPREND MOI À BIEN DEMANDER","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":30,"women":45},"children":{"boys":6,"girls":5},"served":{"men":22,"women":24},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":86,"totalNewMembers":0}'::jsonb, 'Point des véhicules : 13
Voitures : 12
Motos : 1

Observations: 
- Soucis de son au début du lancement de la video de proclamation.
- Soucis de son avec la tv de l’ecodim chez les enfants de +8ans (câble endommagé)
- Ras culte terminé  dans le temps 👌', NULL, 'cBJiVuoCB0UXMBE1KzMM', '2026-05-17T11:29:49.276Z', '2026-05-17T13:29:15.208Z'),
('78ff7642-af53-44b5-8104-c5b68e7fa893', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-05-06', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"ENTRER DANS UNE SAISON DE MATURITÉ (SUITE) ","messageSource":"Apotre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":23,"women":37},"children":{"boys":1,"girls":3},"served":{"men":18,"women":25},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":64,"totalNewMembers":0}'::jsonb, 'Débordement de 18min ', NULL, 'cFgcKK4slvoKmK0nG0vo', '2026-05-06T22:40:01.373Z', '2026-05-06T22:40:01.373Z'),
('f5f2c26a-036f-4748-a266-4d5ce4186c8a', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-03-22', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"DEVELOPPER UN COEUR PURE ","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"blooms":0,"served":{"women":28,"men":19},"adults":{"women":63,"men":43},"conversions":{"women":0,"men":0},"children":{"girls":21,"boys":23}},"newMembers":{"men":2,"women":1,"blooms":0,"children":0},"totalParticipants":150,"totalNewMembers":3}'::jsonb, '-Son fort pendant les Good News
- Souci avec le micro du dirigeant à la sainte cène 
- Débordement de 15min', '-Son fort pendant les Good News
- Souci avec le micro du dirigeant à la sainte cène 
- Débordement de 15min', 'cGRxOa0a7ukUyTRfMnTi', '2026-03-22T13:09:47.436Z', '2026-06-14T00:37:23.933Z'),
('5b8c8dc1-ac6b-4edf-9e7c-76a1295ce095', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-01-12', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"5 ATTITUDE QUI FONT PERDRE L''AMITIÉ DE DIEU.","messageSource":"Pleinement Béni 6","speakerName":"Apôtre Mohammed SANOGO","attendance":{"children":{"boys":5,"girls":6},"adults":{"women":16,"men":17},"conversions":{"men":0,"women":0},"blooms":0,"served":{"men":10,"women":7}},"newMembers":{"children":0,"blooms":0,"women":3,"men":1},"totalParticipants":44,"totalNewMembers":4}'::jsonb, 'Débordement timing de 05 Mn 
Problème d''ouverture de la porte de la salle qui mène vers la sainte Cène
Problème d''ouverture de la porte des toilettes dames
Boss Sono arrivée en Retard
Gestion des culte Assurer par le Responsable TANO. 
Besoin d''ouvrier à la Gestion des culte et à la Sainte Cène.
Petite distraction au niveau de la distribution de la Sainte Cène. 
Les boss doivent amplifier les évangélisation et les invitations personnelles.  
', NULL, 'cZsX7aHQUHyo5X4pnufO', '2025-01-16T12:50:30.423Z', '2026-06-14T00:37:24.097Z'),
('5a6f3fa1-98f4-4aa9-87b4-6d229cc6ce50', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-02-08', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"POURQUOI DOIS-JE FAIRE LA VOLONTÉ","messageSource":"APOTRE MOHAMMED SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":46,"women":72},"children":{"boys":25,"girls":17},"served":{"men":20,"women":25},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":160,"totalNewMembers":0}'::jsonb, '⁠Débordement de 59min 
•⁠  ⁠⁠Fiches pour la réception des nouveaux à imprimer 
•⁠  ⁠⁠Envellopes d’offrandes à imprimer 
•⁠  ⁠⁠
', NULL, 'cdVmJAma3wE9gtFzspnP', '2026-02-17T13:08:44.871Z', '2026-06-14T00:37:24.239Z'),
('9cc77857-627b-4a53-be59-d203bd35b677', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-02-02', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"MONTER POUR RECEVOIR","messageSource":"8 HABITUDES À ABANDONNER POUR VOIR DIEU : PMS","speakerName":"Pasteur Wilfried SEZAN","attendance":{"children":{"boys":7,"girls":11},"adults":{"women":23,"men":21},"blooms":0,"conversions":{"women":0,"men":0},"served":{"women":7,"men":8}},"newMembers":{"blooms":2,"children":4,"women":5,"men":1},"totalParticipants":62,"totalNewMembers":12}'::jsonb, '
- Lancement d’un spot pour les offrandes pendant que le dirigeant parlait 
- Toilettes des femmes défectueuses 
- La température était basse dans la salle (vérifier les climatiseurs allumés et la température pendant le culte ) 
', NULL, 'ctZstLuDUNNkyqmzx0cJ', '2025-02-03T13:31:00.318Z', '2026-06-14T00:37:24.385Z'),
('ea719000-591c-4432-95f4-32e7feaeeeed', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-06-18', '645cea6d-2969-47c8-9e61-c0ec50f3518e', 'JEUNE ET PRIERE ', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"JOUR 4: MA MAISON SERA APPELÉE UNE MAISON DE PRIÈRE!","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":13,"women":22},"children":{"boys":2,"girls":0},"served":{"men":11,"women":17},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":37,"totalNewMembers":0}'::jsonb, 'Point des véhicules : 8
Voitures : 8
Motos : 0

Observations: 
	⁃	Problème de son lors lors du lancement du culte sur le direct 
	⁃	Absence de son dans le micro du dirigeant lors du début de la prière.
	⁃	culte débuté avec 15 minutes de retard  en raison de l’absence du serviteur de la sono
	⁃	Sonnerie du téléphone d’un serviteur pendant les annonces 
	⁃	Réduction du temps de prédication du pasteur de 15minutes. 
	⁃	Débordement de 30 minutes pour la prédication 
	⁃	Débordement global de 25minutes pour le culte
', NULL, 'cxUVrwE44iZG124kO4WP', '2026-06-18T21:49:22.344Z', '2026-06-18T21:49:22.344Z'),
('9c28739c-04cd-46e0-af1d-a9ea207b3ba8', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-07-19', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"2E CULTE :  LA QUESTION QUI DÉRANGE… ","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"conversions":{"women":0,"men":0},"blooms":0,"children":{"boys":21,"girls":12},"served":{"women":24,"men":16},"adults":{"women":62,"men":30}},"newMembers":{"women":6,"children":0,"blooms":0,"men":0},"totalParticipants":125,"totalNewMembers":6}'::jsonb, 'Observations :  
- Retard dans le lancement du culte dû au débordement du 1er culte 
- Débordement de 48min 
', NULL, 'cxZxmqZqLUtqE3iQB014', '2026-07-19T14:56:59.729Z', '2026-07-19T14:56:59.729Z'),
('4c53f406-571e-4396-91b5-cc3c7d166998', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-03-02', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"APPRENDRE À AIMER DIEU","messageSource":"PRIONS POUR UN TORRENT D''AMOUR ET DE GRÂCE | JOUR 2- Jeûne et prière ","speakerName":"Apôtre Mohammed SANOGO","attendance":{"blooms":4,"conversions":{"men":0,"women":0},"adults":{"women":39,"men":23},"served":{"men":10,"women":13},"children":{"boys":7,"girls":9}},"newMembers":{"men":5,"blooms":2,"women":8,"children":0},"totalParticipants":82,"totalNewMembers":15}'::jsonb, '•⁠  ⁠Erreur sur le timing au niveau de l’heure de montée du dirigeant : Gestion des cultes  
•⁠  ⁠10 mn de retard sur la prédication / Culte terminé avec 05 mn d’avance 
•⁠  ⁠Besoin d’un portier à l’entrée pour orienter les nouveaux qui sont en retard : Tata Blanche + Respo TUEHI + Pasteur 
•⁠  ⁠Difficultés avec les chants au début / instaurer une répétions avec les chantres à partir de 7h le dimanche : Pasteur 
•⁠  ⁠Une veillée des serviteurs à préparer : date à confirmer par le Pasteur 
•⁠  ⁠Les rdv des champions débuteront en avril : Chaque département doit se préparer / Le Pasteur confirmera la date de début 
', NULL, 'dGBUrU8YLUP3xYzQMVMA', '2025-03-02T13:06:27.918Z', '2026-06-14T00:37:24.529Z'),
('03c69aa4-55f0-4ede-ad92-6a9608e3b2a0', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-07-16', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"SECRET D''UNE VIE VICTORIEUSE","messageSource":"APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"women":20,"men":17},"children":{"girls":5,"boys":5},"conversions":{"men":0,"women":0},"blooms":0,"served":{"women":9,"men":13}},"newMembers":{"children":0,"women":0,"blooms":0,"men":0},"totalParticipants":47,"totalNewMembers":0}'::jsonb, NULL, NULL, 'dIIguZOHJH9hmoB0tffp', '2025-07-20T15:46:37.051Z', '2026-06-14T00:37:24.690Z'),
('8e6adddd-c0ed-45de-b049-ace425b54057', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-05-27', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"L''ASSISTANCE DIVINE ","messageSource":"CULTE DU DIMANCHE DE PENTECOTE KODESH ","speakerName":"REVEREND STEVE MENSAH ","attendance":{"adults":{"men":22,"women":33},"children":{"boys":1,"girls":1},"served":{"men":8,"women":9},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":57,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Son du micro de la dirigeante faible au début 
•⁠  ⁠Interruption d’image pendant la vidéo
•⁠  ⁠Sonnerie de téléphone connecté à la régie. 
•⁠  ⁠Débordement global de 27min 

Point des véhicules: 
Véhicules : 13
Voitures : 12
Motos : 1
', NULL, 'dZy2A0lJbCrKVokAxm2c', '2026-05-28T12:47:09.678Z', '2026-05-29T10:54:41.223Z'),
('930bb152-1adb-4377-a095-414f390e1029', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-10-29', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"LES BIENFAITS DE LA PRIERE D''INTERCESSION","messageSource":"Apprends-moi à Prier: Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":17,"women":22},"children":{"boys":5,"girls":6},"served":{"men":11,"women":7},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":50,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Portiers absents au lancement 
•⁠  ⁠Son de la basse trop fort 
•⁠  ⁠Absence de PH dans le toilette femme
•⁠  ⁠Absence de portiers pendant le culte 
•⁠  ⁠Bavardage des serviteurs de la com pendant le culte
•⁠  ⁠Débordement de 32min 
', NULL, 'dwadaXATgcQCsqdP6KMi', '2025-10-30T07:59:32.906Z', '2025-10-30T07:59:32.906Z'),
('d08709ed-5bc8-49e7-ac85-700d42926ecc', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-03-11', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA PREPARATION DU CHAMPION","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":19,"women":19},"children":{"boys":2,"girls":1},"served":{"men":16,"women":14},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":41,"totalNewMembers":0}'::jsonb, 'Retard de 14 minutes pour le lancement dû à l’absence des chantres 
- Retard du pianiste 
- Débordement de 47min', NULL, 'dzGAupG76E5AcWUYPdTx', '2026-03-12T09:58:11.186Z', '2026-06-14T00:37:24.827Z'),
('32ca47eb-744a-4fb3-b18d-81b341c3d9e7', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-08-27', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"DÉVELOPPEZ VOTRE ASSURANCE","messageSource":"Apôtre Mohammed Sanogo","speakerName":"Pasteur Wilfried SEZAN","attendance":{"served":{"men":11,"women":0},"conversions":{"men":0,"women":0},"adults":{"men":23,"women":15},"children":{"boys":2,"girls":3},"blooms":0},"newMembers":{"children":0,"women":0,"blooms":0,"men":0},"totalParticipants":32,"totalNewMembers":0}'::jsonb, 'RAS', NULL, 'e4P1d8GRYfg7etm1hgTA', '2025-08-28T19:54:02.636Z', '2026-06-14T00:37:24.960Z'),
('f107a8c3-a5d4-45ac-9e45-59286f7ff727', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-03-18', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA PREPARATION DU CHAMPION ","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":19,"women":20},"children":{"boys":4,"girls":1},"served":{"men":14,"women":14},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":44,"totalNewMembers":0}'::jsonb, 'Retard de la com de 2minutes au lancement du décompte.
- Pianiste et guitariste absent au lancement.
- Écrans éteint lors de la prédication.
- Débordement de 24 minutes ', NULL, 'eNhv0hl60BfbKZ9LKFrf', '2026-03-19T07:49:00.382Z', '2026-06-14T00:37:25.103Z'),
('7588a8fa-181f-4cf8-bc17-59f8c97b3f0a', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-07-20', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"ABBA PERE ","messageSource":"\"La Prière du Notre Père\" APOTRE MOHAMMED SANOGO1","speakerName":"Pasteur Wilfried SEZAN","attendance":{"conversions":{"men":0,"women":0},"adults":{"women":44,"men":33},"served":{"women":20,"men":16},"blooms":0,"children":{"boys":12,"girls":15}},"newMembers":{"women":6,"blooms":0,"men":0,"children":0},"totalParticipants":104,"totalNewMembers":6}'::jsonb, '⁠Quelques soucis techniques au niveau de la COM lors du lancement du culte


', NULL, 'eRHr2OOvsaoXhmeymlFT', '2025-07-20T13:30:05.460Z', '2026-06-14T00:37:25.255Z'),
('9767f97a-fdf3-44bc-8011-17663235a609', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-11-16', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"PRIER EN APPELANT DIEU PAPA ","messageSource":"la Prière qui produit la surabondance: APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"women":64,"men":32},"blooms":0,"conversions":{"men":0,"women":0},"children":{"girls":14,"boys":18},"served":{"women":28,"men":19}},"newMembers":{"men":3,"women":2,"blooms":0,"children":0},"totalParticipants":128,"totalNewMembers":5}'::jsonb, ' .Le temps d’affichage du numéro pour les offrandes en ligne est cours / les dirigeants doivent également annoncer que les offrandes en ligne sont possibles 
    . Les paniers des offrandes utilisés par les portiers sont vieux , les neufs ne sont pas scellés == utiliser les paniers neufs , de même couleur et sceller les paniers la veille 
•⁠  ⁠⁠Chaleur dans la salle 
•⁠  ⁠Débordement global de 14min 
', NULL, 'eSZP8GrS2P1iUANnreZM', '2025-11-18T10:33:44.316Z', '2025-11-18T10:36:36.333Z'),
('a979a27f-9a13-4700-9bbc-a8d66b691b1b', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-05-07', '068f255c-f24c-4e11-af66-607b8c42f229', 'Séminaire', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"JOUR 1: REUSSIR MON MARIAGE UNE PRIORITE POUR MA DESTINEE ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Frederick VAZ FERNANDES","attendance":{"adults":{"men":42,"women":65},"children":{"boys":4,"girls":4},"served":{"men":12,"women":27},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":115,"totalNewMembers":0}'::jsonb, 'Point des véhicules : 23
Voitures : 20
Motos : 3

Observations : 
- Logistique : Sécuriser le tapis (risque de trébuchement identifié).
- Débordement de 1h25min 
', NULL, 'eVWlysnFi0dq6jPQyCjl', '2026-05-08T01:20:00.455Z', '2026-05-10T15:16:24.442Z'),
('e9c5dbf9-6a24-492e-9d45-f5fd8fa38d30', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-04-22', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"ENTRER DANS UNE SAISON DE MATURITÉ ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":17,"women":23},"children":{"boys":2,"girls":5},"served":{"men":13,"women":14},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":47,"totalNewMembers":0}'::jsonb, 'Souci de son au lancement de la vidéo de proclamation
- Débordement de 19min
', NULL, 'ecIqWc3segy8IPjAKBnR', '2026-04-23T03:51:15.306Z', '2026-06-14T00:37:25.401Z'),
('d4743546-3b51-4757-8543-1df960277580', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-05-31', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"1ER CULTE: PERE APPREND MOI À BIEN TE DEMANDER","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"children":{"girls":4,"boys":6},"served":{"women":23,"men":15},"blooms":0,"conversions":{"men":0,"women":0},"adults":{"women":42,"men":32}},"newMembers":{"men":2,"women":1,"blooms":0,"children":0},"totalParticipants":84,"totalNewMembers":3}'::jsonb, 'Point des véhicules : 13
Voitures : 12
Motos : 1

Observations : 
- Certains serviteurs n’étaient pas totalement prêts pendant le décompte ( ça entrainé de la distraction et du bavardage dans la salle au lancement du culte)
- Souci de son avec le micro de la dirigeante 
- Erreur sur la date du prochain mardi du mariage sur le timing 
- Débordement de 3min ', NULL, 'fLSnl0wbBmhMbKlCDppY', '2026-05-31T12:01:43.804Z', '2026-05-31T14:55:48.379Z'),
('0cc44dfd-8f47-42f3-afcb-24b6f4fa8b6d', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-02-18', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LES CLÉS POUR TRIOMPHER PAR LA PUISSANCE DIVINE (SUITE) ","messageSource":"APOTRE MOHAMMED SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":16,"women":26},"children":{"boys":2,"girls":2},"served":{"men":15,"women":15},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":46,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Souci de son pour la vidéo de proclamation 
•⁠  ⁠Souci de son pendant les good news 
•⁠  ⁠Débordement de 23 min
', NULL, 'fO2hyyFbKNWfe0xiY9of', '2026-02-24T12:12:56.617Z', '2026-06-14T00:37:25.545Z'),
('a7b08c96-3aeb-44b1-85d7-df9c927fe119', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-05-17', '2121e6a8-1df7-4842-8447-6b918a69be81', 'CULTE DES BOSS', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"CULTE DES BOSS ","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":20,"women":28},"children":{"boys":1,"girls":0},"served":{"men":0,"women":0},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":49,"totalNewMembers":0}'::jsonb, 'Points abordés : 
- La distraction, le manque de discipline surtout dans la vie de prière 
- L’attitude du peuple dépend de l’attitude des BOSS
- Les brebis et les boucs : Dieu connaît ses brebis, elles entendent sa voix et elles le suivent 
- La gestion du matériel  
', NULL, 'fqDlNwggNbL8i6Fd723v', '2026-05-18T18:14:12.457Z', '2026-05-18T18:14:12.457Z'),
('af91fbc8-65ce-456e-97f5-77b8229e3b69', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-06-10', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"LES 3 R QUI PRÉCÈDENT LA VICTOIRE ","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"blooms":0,"served":{"women":15,"men":17},"conversions":{"men":0,"women":0},"adults":{"men":20,"women":24},"children":{"girls":0,"boys":1}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":45,"totalNewMembers":0}'::jsonb, 'Point véhicule:
Véhicules : 07
Voitures : 06
Motos : 01

Observations : 
Débordement global du culte :25 min 
Débordement de la prédication :24 min', NULL, 'fs7XtimCEGa2xBGZRzmT', '2026-06-10T22:27:38.898Z', '2026-06-14T11:11:01.282Z'),
('b77bf93d-d913-488d-b5f9-6616811be045', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-04-08', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA PREPARATION DES CONSACRE ES ","messageSource":"Apôtre Mohammed Sanogo ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":17,"women":22},"children":{"boys":2,"girls":2},"served":{"men":13,"women":17},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":43,"totalNewMembers":0}'::jsonb, 'Lancement du culte en retard de 2 minutes en raison d’un soucis de son  aux écrans lors de la vidéo de proclamation
Mm
- Son faible au début des good news
- Débordement de 15min en raison de la prédication 
', NULL, 'g7Xm30kXyqlqQS1I7ZPy', '2026-04-08T21:14:46.125Z', '2026-06-14T00:37:25.684Z'),
('8b8adfbf-e726-4e21-afb8-e05399021b4c', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-04-20', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA CROIX DE CHRIST ","messageSource":"PORTER SA CROIX : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"blooms":0,"served":{"men":11,"women":17},"conversions":{"men":0,"women":0},"children":{"boys":14,"girls":13},"adults":{"men":21,"women":44}},"newMembers":{"women":17,"men":0,"blooms":0,"children":0},"totalParticipants":92,"totalNewMembers":17}'::jsonb, '•⁠  ⁠La première parade a été plus longue que le temps prévu au timing 
•⁠  ⁠Omissions de certaines annonces sur le timing 
•⁠  ⁠Disposition de la table en retard qui a impacté la distribution 
•⁠  ⁠Mauvaise prise en main des paniers par les portiers lors de la prière 
•⁠  ⁠Les serviteurs doivent être en poste le vendredi à partir de 18h. Mini veillée de 20h à minuit. 
•⁠  ⁠Split de la salle annexe à réparer 
•⁠  ⁠Améliorer le rangement du matériel par la com / les portiers ….

À planifier 
 
•⁠  ⁠Une veillée des serviteurs à préparer : 25 Avril / thème + créa à diffuser 
•⁠  ⁠Les rdv des champions débuteront  le Mercredi 07 Mai / Chaque département doit se préparer
', NULL, 'gDY8ywBz0l12XU3N8VCk', '2025-04-21T09:49:47.804Z', '2026-06-14T00:37:25.818Z'),
('bccc1f6c-3e5e-4766-945d-dd265da21208', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-06-24', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"L’HYPOCRISIE RELIGIEUSE ","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":20,"women":16},"children":{"boys":0,"girls":4},"served":{"men":15,"women":12},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":40,"totalNewMembers":0}'::jsonb, 'Point des véhicules : 7
Voitures : 6
Motos :1

Observations: 
	⁃	Retard de 3 mn au lancement du culte 
	⁃	Gestion des cultes absente au lancement 
	⁃	 Le dirigeant a utilisé le « Tu » 
     -   Débordement de 14 min pour la prédication 
	- Débordement global du culte de 20min
', NULL, 'gPGxV0DNe6RLar2nXV7h', '2026-06-24T22:26:02.982Z', '2026-06-24T22:26:02.982Z'),
('2466e187-669f-4f9d-80e1-4f633a9098f6', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-12-24', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"JESUS LE PLUS BEAU CADEAU ","messageSource":"APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":42,"women":80},"children":{"boys":27,"girls":20},"served":{"men":29,"women":30},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":169,"totalNewMembers":0}'::jsonb, 'Débordement global 30 mn : les serviteurs étaient en retard / Retard du lancement du programme 
· Mauvaise coordination des différentes prestations de l’ecodim 
. Mettre en place un poste de Event Manager pour des programmes de cette envergure 
.Planifier un filage de bout en bout 
 . Annulation de la prestation des bloomers 
 . Retard de l’artiste invité 
', NULL, 'gfGqwC0548q8WzJ2x2KY', '2026-02-17T11:50:50.656Z', '2026-06-14T00:37:25.957Z'),
('8e21df60-5bed-4470-87c3-a01f5c15bc97', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-01-11', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"RÉACTIVER LES PUITS DU PERE ","messageSource":"PREMIER MESSAGE DE L''ANNEE : APOTRE MOHAMMED SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":35,"women":58},"children":{"boys":18,"girls":10},"served":{"men":15,"women":17},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":2,"women":2,"blooms":0,"children":0},"totalParticipants":121,"totalNewMembers":4}'::jsonb, 'débordement de 18min 
•⁠  ⁠⁠Son du dirigeant bas dans la salle et en ligne pendant la 1ere offrande
•⁠  ⁠⁠omission de l’annonce pour l’offrande pour le pasteur Mohammed 
', NULL, 'giaKFGVLRhVRrF6ZofCD', '2026-02-17T12:05:07.702Z', '2026-06-14T00:37:26.119Z'),
('a7313c30-d762-4ec9-ae71-4eed8de9e883', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-06-15', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"MAITRISER LES SUJETS DE PRIERES QUI OUVRENT LE CIEL ","messageSource":"APPRENDS-MOI A PRIER: APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"children":{"boys":13,"girls":14},"served":{"men":12,"women":16},"conversions":{"men":0,"women":0},"blooms":2,"adults":{"men":29,"women":48}},"newMembers":{"men":4,"blooms":0,"children":0,"women":3},"totalParticipants":106,"totalNewMembers":7}'::jsonb, '-Problèmes de sons avec le micro de la dirigeante en début
-problème avec micro du pasteur 
-son faible chez le pianiste 
Manque de coordination dans la distribution des cadeaux 
La vidéo de bonne fête du Pasteur Liliane est passée à la fin au lieu du début 
Le pianiste programmer n''est pas venu. ', NULL, 'hpqiTn5H7n4fH8Bb7MwW', '2025-06-16T18:09:30.290Z', '2026-06-14T00:37:26.265Z'),
('5db259e3-f311-43f7-ae95-1f1f349ce4be', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-10-19', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"LES DIFFERENTES SORTES DE PRIERE: LA PRIERE DE COMBAT","messageSource":"APPRENDS-MOI A PRIER: APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"children":{"girls":9,"boys":21},"adults":{"men":30,"women":51},"served":{"women":20,"men":15},"conversions":{"men":0,"women":0},"blooms":0},"newMembers":{"men":0,"women":0,"blooms":2,"children":0},"totalParticipants":111,"totalNewMembers":2}'::jsonb, '-Les fiches de recensement des âmes qui donnent leurs vies à Jésus sont finies : besoin à remonter à tata Blanche pour récupérer au siège 

', '-Prévoir d’acheter des parapluies pour l’église : Tata Blanche 
-Enveloppes 931 à pourvoir : Videme. M. ', 'iCBUSrYny6iR46MDScBh', '2025-10-22T16:36:07.476Z', '2025-10-22T16:36:54.238Z'),
('323871b7-f08e-46c3-9e90-6966b300a819', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-09-10', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"L''ESPERANCE DE LA FOI","messageSource":"Les 5 déterminants de la foi: Apôtre MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"children":{"girls":4,"boys":4},"conversions":{"men":0,"women":0},"adults":{"men":19,"women":25},"served":{"men":8,"women":8},"blooms":0},"newMembers":{"children":0,"men":0,"blooms":0,"women":0},"totalParticipants":36,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Chantres en retard 
•⁠  ⁠Débordement 20 mn 
•⁠  ⁠Bruits émanant de la com pendant le culte 
', NULL, 'ipAJX5nVEzQEnnY7d83R', '2025-09-11T13:50:02.563Z', '2026-06-14T00:37:26.403Z'),
('4b2bf473-307b-48d0-b69c-0cbbe92057d9', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-06-15', '645cea6d-2969-47c8-9e61-c0ec50f3518e', 'JEUNE ET PRIERE ', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"JOUR 1 JEUNE ET PRIERE: ACTIONS DE GRACE ET BILAN À MI-PARCOURS","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteure Rachelle Sezan","attendance":{"adults":{"men":12,"women":17},"children":{"boys":0,"girls":3},"served":{"men":11,"women":13},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":32,"totalNewMembers":0}'::jsonb, 'Point des véhicules : 7
Voitures : 7
Motos : 0

Observations: 
	⁃	Le Culte a débuté avec un retard de 10minutes,la com n’était pas encore prête dans sa mise en place.
	⁃	Timing réajusté à 35 minutes pour la prière du dirigeant.
	⁃	Le téléphone d’un membre du groupe musical a sonné pendant la prédication 
	⁃	Temps de prédication pastorale réajusté à 30minutes 
	⁃	Bel esprit d’anticipation pour les éléments de la com.
      -   Culte terminé avec une avance de 2 minutes 
', NULL, 'jZ1Rx8VfJfkpZ5qznPBq', '2026-06-17T11:12:54.685Z', '2026-06-17T11:12:54.685Z'),
('84a7bceb-396a-4e80-acb3-de23e9a9a703', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-11-05', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"LES 5 ENNEMIS DE LA GRÂCE","messageSource":"APOTRE MOHAMMED SANOGO","speakerName":"AP CHRISTIAN ","attendance":{"adults":{"men":19,"women":35},"children":{"boys":2,"girls":2},"served":{"men":10,"women":0},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":58,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Impression du timing en retard 
•⁠  ⁠Le micro du dirigeant crachait 
•⁠  ⁠Lenteur affichage des versets 
•⁠  ⁠Mauvaise disposition des chantres pendant le Teach and Pray 
', NULL, 'jnWJstO6eUevMYkZFVAc', '2025-11-13T16:01:12.968Z', '2025-11-13T16:01:12.968Z'),
('e623bfaf-fc31-42df-9e58-6ebb7385bd77', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-05-28', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"CHAMPIONS DE LA PAROLE: AGIR SELON LA PAROLE ","messageSource":"APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"women":18,"men":14},"served":{"men":13,"women":8},"conversions":{"women":0,"men":0},"blooms":0,"children":{"boys":6,"girls":10}},"newMembers":{"women":0,"men":0,"children":0,"blooms":0},"totalParticipants":48,"totalNewMembers":0}'::jsonb, NULL, NULL, 'kFXPYyPIDmcbtz1jAX3P', '2025-05-30T07:35:32.961Z', '2026-06-14T00:37:26.552Z'),
('4b5a4efb-bf67-4a99-af6f-39b35a8d136c', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-02-01', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"FIRE SUNDAY","messageSource":"PASTEUR YOMO SAMUEL ","speakerName":"PASTEUR YOMO SAMUEL ","attendance":{"adults":{"men":45,"women":62},"children":{"boys":12,"girls":19},"served":{"men":23,"women":16},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":1,"women":4,"blooms":0,"children":0},"totalParticipants":138,"totalNewMembers":5}'::jsonb, '•⁠  ⁠Débordement de 1h 
', NULL, 'kOXYB1uT9n2SKASbQSrm', '2026-02-17T13:00:51.220Z', '2026-06-14T00:37:26.694Z'),
('c5b37509-82f0-4a5b-8f74-4b0debc06a5e', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-06-23', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"MDM: LES TEMPERAMENTS ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":15,"women":18},"children":{"boys":0,"girls":0},"served":{"men":11,"women":13},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":33,"totalNewMembers":0}'::jsonb, 'Engins roulants:  5
Voitures: 5
Motos : 0

⁃	Observations.  
	⁃	Lancement avec 8 min de retard ( la com n’était pas prête)                              
	⁃	Aucun signal sur l’une des télés
	⁃	son faible dans l’un des micros des intervenants 
	⁃	Débordement de 31min pour les questions réponses 
	⁃	Intervention du pasteur fini avec une minutes de retard 
	⁃	Débordement global de 47 minutes 
', NULL, 'kYyp0we4ocKJXTTQhcEz', '2026-06-24T20:31:51.732Z', '2026-06-24T20:31:51.732Z'),
('4ece8e48-c766-479e-b4e0-600609b5bd98', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-04-06', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"TOUJOURS PLUS QUE VAINQUEURS","messageSource":"LA PRIERE QUI DONNE UN EXHAUSSEMENT A 100%: APOTE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"served":{"men":10,"women":14},"adults":{"men":26,"women":39},"children":{"girls":14,"boys":19},"blooms":0,"conversions":{"men":1,"women":0}},"newMembers":{"men":3,"children":0,"blooms":0,"women":1},"totalParticipants":98,"totalNewMembers":4}'::jsonb, '•⁠  ⁠Débordement 17 mn du message 
•⁠  ⁠Problème de son avec le micro cravate  du Pasteur au début du message : test des 2 micros à faire avant le début du culte 
•⁠  ⁠Sol des toilettes hommes pas propre : prévoir un contrôle pendant le culte Respo Valentin en charge 
•⁠  ⁠Organisation des annonces : communiquer tous les éléments devant passer au culte à la gestion pour prise en compte 
•⁠  ⁠Porte donnant sur la chaire à réparer : Suivi en semaine par le Pasteur 
•⁠  ⁠Acheter des colliers pour sceller les paniers d’offrandes : Mme TUEHI / voir avec Respo Valentin 

•⁠  ⁠Débordement 17 mn du message 
•⁠  ⁠Problème de son avec le micro cravate  du Pasteur au début du message : test des 2 micros à faire avant le début du culte 
•⁠  ⁠Sol des toilettes hommes pas propre : prévoir un contrôle pendant le culte Respo Valentin en charge 
•⁠  ⁠Organisation des annonces : communiquer tous les éléments devant passer au culte à la gestion pour prise en compte 
•⁠  ⁠Porte donnant sur la chaire à réparer : Suivi en semaine par le Pasteur 
•⁠  ⁠Acheter des colliers pour sceller les paniers d’offrandes : Mme TUEHI / voir avec Respo Valentin 
', NULL, 'l6jskWrw7yuvjMNhkVPn', '2025-04-06T23:53:52.320Z', '2026-06-14T00:37:26.836Z'),
('10898762-c828-4d5d-b384-0755974a2703', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-01-14', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"2026 ANNÉE DE TRIOMPHE SUR LES ENNEMIS","messageSource":"BENEDICTION DE L''ANNEE 2026 : APOTRE MOHAMMED SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":15,"women":21},"children":{"boys":2,"girls":2},"served":{"men":8,"women":6},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":40,"totalNewMembers":0}'::jsonb, '⁠Retard du pianiste 
•⁠  ⁠Absence de son lors la vidéo de bénédiction, la sono n’était pas à son poste pour régler le problème 
•⁠  ⁠⁠Interruption du directe sur YouTube 
•⁠  ⁠Débordement de 14min 
', NULL, 'lBYhgpXM3jai2LH4rd2I', '2026-02-17T12:09:30.440Z', '2026-06-14T00:37:27.000Z'),
('5ad7bef2-9829-4a5b-98ac-9e09751bb501', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-03-17', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', NULL, 'Inconnu (ancien système)', '{"messageTheme":"MARDI DU MARIAGE ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":17,"women":19},"children":{"boys":0,"girls":1},"served":{"men":11,"women":11},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":37,"totalNewMembers":0}'::jsonb, 'Retard de 27 minutes lors du lancement, motif : la com était en retard lors de la mise en place. 

- Luminosité à l’écran sombre au départ lors de l’intervention du pasteur 

- Débordement global de 48 minutes 
', NULL, 'lGwoGsINstwFS5uq8tcD', '2026-03-19T11:24:38.148Z', '2026-06-14T00:37:27.142Z'),
('c0f6b4d7-13e9-4f8f-a07c-508cec6f58b2', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-12-17', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"DÉLIVRE  NOUS DE L''ESPRIT DE DISTRACTION ET D’ÉGAREMENT ","messageSource":"LIVRER DE JEUNE DEC 2025 ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":6,"women":18},"children":{"boys":2,"girls":2},"served":{"men":10,"women":13},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":28,"totalNewMembers":0}'::jsonb, '⁠Débordement global 24 mn
', NULL, 'lVhzUcdpLsuM6iMRMUp1', '2026-02-09T10:47:54.862Z', '2026-02-09T10:47:54.862Z'),
('07f51351-6ffe-46e2-8fef-d904c39ea75a', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-05-25', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"POURQUOI APPRENDRE À PRIER? ","messageSource":"Apprend-moi à Prier : Apôtre MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"conversions":{"men":0,"women":0},"blooms":10,"children":{"girls":13,"boys":11},"served":{"men":18,"women":18},"adults":{"men":28,"women":38}},"newMembers":{"men":0,"blooms":0,"women":2,"children":0},"totalParticipants":100,"totalNewMembers":2}'::jsonb, '•⁠  ⁠Débordement global de 10 mn 
•⁠  ⁠Manque de coordination au niveau des chantres au début du culte : veiller à arriver tôt pour répéter avant le culte 
•⁠  ⁠Problèmes de sons avec le micro du Pasteur : Tests à faire 
•⁠  ⁠Annonces non adaptées à la cellule : veiller à retirer les annonces qui ne correspondent pas à nos programmes 
•⁠  ⁠Faire entrer les paillassons lorsque nous fermons les portes 
•⁠  ⁠Proposition de date de formation des dirigeants 
', NULL, 'm1bD4IK7mrauoE1eB8oV', '2025-05-26T12:31:11.904Z', '2026-06-14T00:37:27.288Z'),
('344b8395-760d-4a1d-8c01-6cbf2a78073f', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-04-13', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"MONTER DANS SON INTIMITÉ","messageSource":"Culte 1 Du 13 Avril centre KODESH ","speakerName":"Apôtre Mohammed SANOGO","attendance":{"blooms":0,"conversions":{"men":0,"women":0},"adults":{"women":39,"men":25},"children":{"girls":11,"boys":13},"served":{"men":12,"women":12}},"newMembers":{"women":0,"men":2,"children":0,"blooms":0},"totalParticipants":88,"totalNewMembers":2}'::jsonb, 'Pas de nouveau : réactiver les invitations et l’évangélisation
•⁠  ⁠Poignée porte côté sono à réparer 
•⁠  ⁠Split de la salle annexe à réparer 
•⁠  ⁠Améliorer le rangement du matériel par la com / les portiers ….

À planifier 
 
•⁠  ⁠Une veillée des serviteurs à préparer : 25 Avril / thème + créa à diffuser 
•⁠  ⁠Les rdv des champions débuteront  le Mercredi 07 Mai / Chaque département doit se préparer
', NULL, 'mS2fx60hnjxjbfxrO9i2', '2025-04-13T13:56:00.903Z', '2026-06-14T00:37:27.433Z'),
('93a2f88d-7089-43f6-9e66-ddee69e71823', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-02-04', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"NOUS TRIOMPHONS DE NOS ADVERSAIRES ET ENNEMIS","messageSource":"LIVRET DE JEUNE FEVRIER 2026 : APOTRE MOHAMMED SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":21,"women":36},"children":{"boys":3,"girls":4},"served":{"men":13,"women":18},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":64,"totalNewMembers":0}'::jsonb, ' ⁠Retard du pianiste 
•⁠  ⁠Débordement de 15min
', NULL, 'mTQY1fH0k8dDqWoqphuo', '2026-02-17T13:04:25.065Z', '2026-06-14T00:37:27.573Z'),
('30159747-f689-480d-a7e7-b2ce60727369', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-08-24', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"MA RELATION AVEC LE SAINT ESPRIT UNE PRIORITE ABSOLUE","messageSource":"APOTRE MOHAMMED SANOGO","speakerName":"PASTEUR YAO SANDRA","attendance":{"conversions":{"men":0,"women":0},"served":{"men":13,"women":0},"adults":{"women":47,"men":42},"blooms":0,"children":{"girls":9,"boys":7}},"newMembers":{"women":1,"men":2,"children":0,"blooms":0},"totalParticipants":92,"totalNewMembers":3}'::jsonb, ' - Problème d’affichage du verset avec la Com
•⁠  ⁠Problème technique au niveau du son pendant les GOOD News
', NULL, 'mrDEPrs9fzUP1NU3iEFw', '2025-08-25T08:56:09.189Z', '2026-06-14T00:37:27.711Z'),
('846624ce-2e56-4592-83f0-5cd17384c8a1', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-04-15', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', NULL, 'Inconnu (ancien système)', '{"messageTheme":"GUÉRIR DES BLESSURES ÉMOTIONNELLES (PARTIE 2)","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":20,"women":25},"children":{"boys":1,"girls":0},"served":{"men":5,"women":8},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":46,"totalNewMembers":0}'::jsonb, NULL, NULL, 'mxYsmtR8ahLBU7GuRPDP', '2026-04-15T13:44:19.696Z', '2026-06-14T00:37:27.849Z'),
('5b26fc83-fc91-4e34-984a-18b65e12d8a7', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-09-03', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA PUISSANCE DE L''ESPERANCE ","messageSource":"LES 5 DETERMINANTS DE LA FOI : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"blooms":0,"adults":{"women":20,"men":18},"conversions":{"women":0,"men":0},"served":{"men":8,"women":6},"children":{"girls":4,"boys":2}},"newMembers":{"women":0,"children":0,"men":0,"blooms":0},"totalParticipants":30,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Absence de portiers 
•⁠  ⁠Débordement 16 mn 
•⁠  ⁠Son du lead fort 
•⁠  ⁠Pas de son au micro du Pasteur à sa montée 
•⁠  ⁠Problème de son au lancement du culte
', NULL, 'n3voVysWIHHe5veiDGis', '2025-09-05T05:03:25.866Z', '2026-06-14T00:37:27.986Z'),
('578c1d72-11c8-4f67-9a2f-15e51e7d13bf', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-07-13', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LE DIALOGUE DIVIN ","messageSource":"Apprends-moi à Prier: Apôtre MOHAMMED SANOGO","speakerName":"Pasteur Jean Michel EHOUO","attendance":{"served":{"men":13,"women":17},"conversions":{"women":0,"men":0},"adults":{"men":27,"women":37},"children":{"girls":10,"boys":12},"blooms":0},"newMembers":{"blooms":0,"women":2,"children":0,"men":0},"totalParticipants":86,"totalNewMembers":2}'::jsonb, 'Le micro du chantre était plus fort que celui de la dirigeante 
•⁠  ⁠Arrivée de l’orateur 09h40
•⁠  ⁠Problème de son (micro de la dirigeante) lors de l’annonce du résumé du Tour 931
•⁠  ⁠La chanson de Bienvenue des nouveaux n’a pas été achevée.
•⁠  ⁠Débordement du culte de 20mn
', NULL, 'nMZf1HQHUOcaFngyp9py', '2025-07-14T11:58:01.293Z', '2026-06-14T00:37:28.127Z'),
('d6ff6db2-d395-4cfe-b8cc-7e92051e1860', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-03-30', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"PLUS QUE VAINQUEUR EN TOUTES CIRCONSTANCES","messageSource":"La mentalité de Vainqueur : Pasteur MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"blooms":0,"adults":{"women":42,"men":17},"conversions":{"men":0,"women":0},"children":{"boys":17,"girls":10},"served":{"women":13,"men":9}},"newMembers":{"women":3,"blooms":0,"children":0,"men":1},"totalParticipants":86,"totalNewMembers":4}'::jsonb, 'Débordement 12 mn 
•⁠  ⁠Gestion des cultes absente au lancement du culte 
•⁠  ⁠Problèmes de son : on n’entend pas bien le Pasteur avec le micro cravate  pendant les chants 
•⁠  ⁠Bip de l’afficheur à mettre off 
•⁠  ⁠Problèmes de sons avec les vidéos 
•⁠  ⁠Avoir une équipe dehors pour « anakagzo » entre le lancement du culte et le début de la prédication 

À planifier 
 
•⁠  ⁠Une veillée des serviteurs à préparer : 25 Avril 
•⁠  ⁠Les rdv des champions débuteront en avril : organiser une réunion d’organisation le Dimanche 06/04 après le culte / Chaque département doit se préparer / Le Pasteur confirmera la date de début 
', NULL, 'nPdYmIxCcHPBCfxndBVh', '2025-03-31T17:41:36.558Z', '2026-06-14T00:37:28.273Z'),
('9f665518-ddc7-4247-81c2-1752d684bea8', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-05-21', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"CHAMPION DE LA PAROLE ","messageSource":"APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"women":26,"men":18},"conversions":{"women":0,"men":0},"children":{"boys":6,"girls":3},"served":{"men":15,"women":15},"blooms":0},"newMembers":{"children":0,"blooms":0,"women":1,"men":0},"totalParticipants":53,"totalNewMembers":1}'::jsonb, 'Observations :

-Quelques problèmes techniques au niveau de la sono
•⁠  ⁠Problème de son avec le micro du dirigeant 
•⁠  ⁠Débordement du message de 12mn 
', NULL, 'nZNy0cRGMEYlDRB02fUj', '2025-05-22T09:58:12.962Z', '2026-06-14T00:37:28.410Z'),
('78cca6b8-b51f-44cf-8ad7-4c033035c574', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-07-21', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LE ROLE DE L''HOMME ","messageSource":"MANUEL DES COUPLES : APOTRE MOHAMMED SANOGO. ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"children":{"girls":0,"boys":0},"adults":{"women":26,"men":14},"conversions":{"women":0,"men":0},"blooms":0,"served":{"women":5,"men":7}},"newMembers":{"blooms":0,"children":0,"men":0,"women":0},"totalParticipants":40,"totalNewMembers":0}'::jsonb, NULL, NULL, 'o2yuBS8zUCOyNZROixyt', '2026-07-22T18:42:28.258Z', '2026-07-22T18:42:28.258Z'),
('4ba42de4-cd3a-48e4-bdc4-47113925dc3a', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2024-12-29', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"DE LA POUSSIÈRE AU SOMMET SUITE","messageSource":"DE LA POUSSIERE AU SOMMET : APOTRE MOHAMMED SANOGO","speakerName":"Apôtre Mohammed SANOGO","attendance":{"children":{"boys":4,"girls":6},"conversions":{"women":0,"men":0},"served":{"men":10,"women":9},"blooms":0,"adults":{"men":19,"women":22}},"newMembers":{"women":0,"children":0,"blooms":0,"men":0},"totalParticipants":51,"totalNewMembers":0}'::jsonb, 'Débordement global de 32 mn 
Retard de lancement de 05 mn pour la préparation des chantres 
Com : Incident , vidéo diffusée en 12mn au lieu de 27 mn 
Portiers : installation sur la droite de la salle 
Crea à Annonce 1er culte de l’année aux couleurs arc en ciel 
', NULL, 'oNGbcgOcf20Ij5Uk56Yv', '2025-05-24T11:08:38.843Z', '2026-06-14T00:37:28.546Z'),
('c898b55d-8e2f-48ea-bfc8-026b3e55beb1', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-05-04', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA FOI QUI AMÈNE À L''EXISTENCE","messageSource":"LA FOI DE DIEU","speakerName":"Pasteur Wilfried SEZAN","attendance":{"blooms":0,"adults":{"men":39,"women":57},"served":{"women":20,"men":19},"conversions":{"women":2,"men":0},"children":{"boys":21,"girls":14}},"newMembers":{"blooms":0,"children":0,"men":11,"women":14},"totalParticipants":131,"totalNewMembers":25}'::jsonb, '•⁠  ⁠Débordement du culte de 5 mn 
-  Problèmes récurrents avec les écrans de la Com  
•⁠  ⁠Organisation des portiers / prise en charge des nouveaux arrivants avec enfants : les portiers doivent demander l’âge de l’enfant et proposer de le déposer à l’ecodim avant de les faire entrer dans la salle 
•⁠  ⁠Le stagiaire affecté aux portiers n’a pas été correctement briefé 
•⁠  ⁠Interruption du courant  : Test à faire pour identifier ce qui fait sauter le compteur 
•⁠  ⁠Les classes  d’affermissement vont débuter le 18 Mai 2025 

À vérifier 

•⁠  ⁠Déco en charge du nettoyage des portes : produit à acheter 
•⁠  ⁠Mettre en place une trousse d’urgence pour les 1ers soins : tata Blanche 

À planifier 
 
•⁠  ⁠Les rdv des champions débuteront  le Mercredi 07 Mai / Chaque département doit se préparer
', NULL, 'okWHyQpPsnPgO69ud61y', '2025-05-05T16:46:01.765Z', '2026-06-14T00:37:28.685Z'),
('b5ecc981-2e7f-4af2-8c19-49b156e5b5f9', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-02-16', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LES OBSTACLES À MON ASCENCION","messageSource":"8 habitudes à abandonner pour voir DIEU. ","speakerName":"Apôtre Mohammed SANOGO","attendance":{"children":{"boys":9,"girls":6},"blooms":4,"adults":{"men":21,"women":28},"conversions":{"women":0,"men":0},"served":{"women":12,"men":14}},"newMembers":{"children":0,"men":2,"women":3,"blooms":0},"totalParticipants":68,"totalNewMembers":5}'::jsonb, ' -  Les chantres ont eu du mal à lancer le premier chant  / Chant des nouveaux mal exécuté par le groupe musical
•⁠  ⁠Installation des portiers à harmoniser 
•⁠  ⁠La coordination entre la com et la sono 
•⁠  ⁠Veiller à la sécurité de l’entrée principale pendant le culte 
•⁠  ⁠Débordement de 30 mn sur le temps de la prédication 
•⁠  ⁠Cas des enfants qui ne peuvent pas aller à l’ecodim : pleurs dans la salle principale 
•⁠  ⁠Problèmes de sons pendant la good news 
•⁠  ⁠La Com a utilisé les good news de la semaine passée : veillez à la mise à jour
•⁠  ⁠Gestion des cultes : Prévoir des plateaux pour l’onction d’huile / Mieux préparer le plan de circulation 
•⁠  ⁠La porte côté sono ne ferme pas bien 
•⁠  ⁠Senteurs et savons à remplacer dans les toilettes 
', NULL, 'omzZEL5GiEu7tWFfgfLy', '2025-02-16T14:35:32.947Z', '2026-06-14T00:37:28.823Z'),
('d674fc2c-0818-4e58-83af-3bc60a7251d1', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-07-09', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA CORRECTION: UNE CLE POUR PROGRESSER","messageSource":"Apôtre Mohammed SANOGO BOOST DU MOIS DE JUIN 2025","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"women":18,"men":12},"served":{"men":9,"women":8},"children":{"girls":8,"boys":7},"blooms":0,"conversions":{"women":0,"men":0}},"newMembers":{"women":0,"men":0,"children":0,"blooms":0},"totalParticipants":45,"totalNewMembers":0}'::jsonb, NULL, NULL, 'owYB8xqAWTgTo4H2mdMf', '2025-07-12T10:34:27.476Z', '2026-06-14T00:37:28.960Z'),
('8013c916-2429-4542-9c76-3010ba5d02d6', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-09-28', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LES DIFFERENTS TYPES DE PRIERES: L''ACTION DE GRACE ","messageSource":"Apprends-moi à Prier: Apôtre mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":32,"women":55},"served":{"men":12,"women":21},"children":{"boys":23,"girls":13},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"women":2,"men":1,"blooms":0,"children":0},"totalParticipants":123,"totalNewMembers":3}'::jsonb, '-Débordement global de 16mn 
-Débordement du dirigeant 
•⁠  ⁠Problème de son (micro du pasteur ) 
-Relance pour l’acquisition de la box pour les sujets de prière (tata Blanche en charge) 

Points de suivi 

•⁠  ⁠L’électricien doit également vérifier les leds côté batterie ( À faire )
•⁠  ⁠Entretien cette semaine à faire pour éradiquer les moustiques (À faire ) 
', NULL, 'pARAbz0wnhwfWnDGIP61', '2025-09-28T16:35:46.853Z', '2026-06-14T00:37:29.102Z'),
('68a0e242-5ad9-4635-b2b0-9f6beab39bcb', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-03-09', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"APPRENDRE À AIMER DIEU (PARTIE 2)","messageSource":"PRIONS POUR UN TORRENT D''AMOUR ET DE GRÂCE : 7 jours de jeune 2025","speakerName":"Apôtre Mohammed SANOGO","attendance":{"children":{"boys":7,"girls":10},"blooms":5,"conversions":{"men":0,"women":0},"served":{"men":11,"women":12},"adults":{"women":36,"men":23}},"newMembers":{"men":2,"children":0,"women":1,"blooms":0},"totalParticipants":81,"totalNewMembers":3}'::jsonb, '•⁠  ⁠12 mn de débordement global 
•⁠  ⁠Problèmes avec le micro du lead
•⁠  ⁠Son du micro dirigeant bas au début de son intervention
•⁠  ⁠La com  et les autres départements doivent communiquer les éléments vidéo et autres à la com samedi midi pour prise en compte au timing 
•⁠  ⁠Télécommande Ecodim défaillant : Respo  Valentin 
•⁠  ⁠Senteurs des toilettes à poser sur un meuble pour éviter l’accès aux enfants : Respo Blanche 
•⁠  ⁠Réparer la table de réception des nouveaux : Respo Blanche 
•⁠  ⁠Plinthe à réparer dans la salle : Respo Blanche 
•⁠  ⁠⁠Nettoyage des chaises de la salle de culte : Sœur Koro 

À planifier 
•⁠  ⁠Veillée du digital du Centre Kodesh à la salle de la CDVH le Vendredi 14 Mars. Certains départements seront saisis 
•⁠  ⁠Une veillée des serviteurs à préparer : 04  Avril 
•⁠  ⁠Les rdv des champions débuteront en avril : Chaque département doit se préparer / Le Pasteur confirmera la date de début 
', NULL, 'pQbnur9eTtAP1RKmOFXk', '2025-03-09T14:30:21.729Z', '2026-06-14T00:37:29.239Z'),
('6968898e-a9de-48f6-84c1-b9939442f7fb', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-02-22', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"COMMENT PRIER SELON LA VOLONTE DE DIEU ? SUITE ","messageSource":"RENONCER A SOIT MEME (APOTRE MOHAMMED SANOGO) ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":31,"women":74},"children":{"boys":23,"girls":17},"served":{"men":18,"women":25},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":3,"blooms":0,"children":0},"totalParticipants":145,"totalNewMembers":3}'::jsonb, '- Son fort dans la salle au début du culte 
- Lenteur d''affichage des versets ', NULL, 'psgMYY5wpRdPJNz0WJYC', '2026-02-22T12:51:11.464Z', '2026-06-14T00:37:29.377Z'),
('946dfd3e-b43c-41d6-89c8-86d36426bd51', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-04-19', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"1ER CULTE: CHERCHER DIEU ET NON LES SOLUTIONS DE DIEU (PARTIE 2)","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":24,"women":40},"children":{"boys":3,"girls":6},"served":{"men":17,"women":26},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":1,"women":1,"children":0,"blooms":0},"totalParticipants":73,"totalNewMembers":2}'::jsonb, 'Point des véhicules : 13

- Souci de son pendant la vidéo de proclamation 
- Souci de son avec la télé de l’écodim 
- Le micro du dirigeant coupé en ligne
- Le dirigeant a utilisé « tu » pendant la 1ère offrande 
- Souci de son au lancement de la 1ère video pour tour 931
', NULL, 'q0NIayLBGbh0hXhcuFHt', '2026-04-19T11:48:10.451Z', '2026-06-14T00:37:29.511Z'),
('89bc2e3d-ee6f-44e4-a92b-290519f1100e', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-12-21', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LES 5 CHOSES POUR MANIFESTER LE RÈGNE DE DIEU ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":39,"women":59},"children":{"boys":18,"girls":20},"served":{"men":16,"women":17},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":136,"totalNewMembers":0}'::jsonb, '-  Dégamage sur le premier chant 
•⁠  ⁠Souci avec le micro du pasteur 

•⁠  ⁠Débordement de 14min 
', NULL, 'qASQ2M6o4fozbIV9NKnH', '2026-02-17T11:42:03.995Z', '2026-06-14T00:37:29.654Z'),
('dd2c509f-0023-4e19-a0f1-b9505318f905', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-12-10', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"COMMENT SE PRIVER DE LA GRACE DE DIEU ","messageSource":"APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":23,"women":24},"children":{"boys":4,"girls":3},"served":{"men":12,"women":7},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":54,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Débordement global 24 mn
•⁠  ⁠Micro des chantres trop fort 
•⁠  ⁠Son dans la salle trop fort
•⁠  ⁠⁠Pianiste en retard
', NULL, 'qewvuoT7nsqSGM29NHOM', '2025-12-12T14:14:43.631Z', '2025-12-12T14:14:43.631Z'),
('4b69b079-09b7-4048-aa64-b87c56ea34aa', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-09-21', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LES DIFFERENTES SORTES DE PRIERES : LA PRIERE DE  SUPPLICATION","messageSource":"APPRENDS -MOI A PRIER: APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"served":{"men":14,"women":19},"blooms":0,"children":{"boys":22,"girls":12},"conversions":{"men":0,"women":0},"adults":{"women":53,"men":29}},"newMembers":{"men":1,"blooms":0,"children":0,"women":2},"totalParticipants":116,"totalNewMembers":3}'::jsonb, '-Problème sur la qualité du son du dirigeant 
•⁠  ⁠Problème de son (micro du pasteur ) 
-Débordement global de 5mn 
-Améliorer la communication entre les différentes entités du culte 
-Relance pour l’acquisition de la box pour les sujets de prière (tata Blanche en charge) 

Points de suivi 

•⁠  ⁠L’électricien doit également vérifier les leds côté batterie ( À faire )
•⁠  ⁠Entretien cette semaine à faire pour éradiquer les moustiques (À faire ) 
', NULL, 'qkbHCsQVpd0hvDlge0RI', '2025-09-21T16:05:25.926Z', '2026-06-14T00:37:29.803Z'),
('5c5c2bf7-5a0c-4067-8d97-58ee09825ab0', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-02-23', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LES OBSTACLES À MA MONTÉE","messageSource":"08 habitudes à abandonner pour voir Dieu. ","speakerName":"Apôtre Mohammed SANOGO","attendance":{"blooms":3,"children":{"boys":9,"girls":5},"adults":{"men":18,"women":22},"conversions":{"women":0,"men":0},"served":{"women":10,"men":10}},"newMembers":{"children":0,"men":0,"women":1,"blooms":0},"totalParticipants":57,"totalNewMembers":1}'::jsonb, '-  Débordement  de 40 mn === les gens sont partis avant la fin du culte 
-  Diffusion des versets lente : planifier des formations hors des temps de culte 
•⁠  ⁠Omission de l’appel à conversion 
•⁠  ⁠01 seul nouveau = baisse des invitations et évangélisations 
', NULL, 'qvqzP2rwgy8EfSB1Snmw', '2025-02-24T16:07:11.867Z', '2026-06-14T00:37:29.947Z'),
('2b83eb5e-92e4-4369-bef7-bf579640284c', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2024-12-01', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA GRÂCE DE COMMENCER ET BIEN ACHEVER.","messageSource":"Pleinement Béni. Verset de base: Deuteronome 28:6","speakerName":"Pasteur Thierry N''DOUFOU","attendance":{"children":{"boys":1,"girls":3},"blooms":1,"served":{"men":6,"women":9},"adults":{"men":28,"women":29},"conversions":{}},"newMembers":{"women":0,"blooms":0,"men":0,"children":0},"totalParticipants":62,"totalNewMembers":0}'::jsonb, '- Lancement en retards
- problème de son au niveau des vidéos
- Vidéos plantés
- Retard des serviteurs 
- Absence serviteurs de la sono. 

Appel à conversion: 7 personnes 
', NULL, 'rgd2lcsUgrYHtFP2u9yd', '2025-01-04T18:37:36.338Z', '2026-06-14T00:37:30.094Z'),
('b2329b43-6e57-445d-a280-99938c90911c', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-07-22', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"UNE MAISON DE PRIÈRE","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"served":{"men":7,"women":19},"children":{"girls":2,"boys":0},"adults":{"men":14,"women":24},"blooms":0,"conversions":{"women":0,"men":0}},"newMembers":{"men":0,"blooms":0,"children":0,"women":0},"totalParticipants":40,"totalNewMembers":0}'::jsonb, 'Observations : 
	⁃	Batteur et pianiste absents lors du lancement du culte.
	⁃	serviteur de la sono hors de la salle de culte durant la louange.
	⁃	La dirigeante a tutoyé,et elle a portée du jeans
	⁃	Débordement de 5minutes pour la prédication.
	⁃	Débordement global du culte de 14 minutes 

Point véhicule 
véhicules : 08', NULL, 'rrh1FuJYkkahwt0Uxc94', '2026-07-22T21:23:56.822Z', '2026-07-22T21:23:56.822Z'),
('0017a4a0-fc2d-4862-a6e3-02d0cb0c95f9', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-05-11', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA PRIERE","messageSource":"OUVRAGE: APPRENDS MOI A PRIER (APOTRE MOHAMMED SANOGO)","speakerName":"Pasteur Wilfried SEZAN","attendance":{"children":{"girls":13,"boys":21},"served":{"women":18,"men":15},"adults":{"men":29,"women":57},"conversions":{"men":2,"women":3},"blooms":0},"newMembers":{"children":0,"men":5,"women":5,"blooms":0},"totalParticipants":120,"totalNewMembers":10}'::jsonb, '•⁠  ⁠Débordement du message de 22 mn
•⁠  ⁠Débordement global de 13 mn 
-  Problèmes de sons avec le micro baladeur du Pasteur
•⁠  ⁠Interruption de l’électricité 
•⁠  ⁠Passer une vidéo pendant l’attente entre la prière des serviteurs et le lancement du culte pour le peuple déjà présent 
•⁠  ⁠Les classes  d’affermissement vont débuter le 25 Mai 2025 : Besoins à énoncer', NULL, 's3wBvlMhR8kQtKQQXjC8', '2025-05-12T09:50:37.829Z', '2026-06-14T00:37:30.233Z'),
('6b9f9d81-33d3-4d5c-a84c-81e45fbf8d16', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-01-26', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"5 ATTITUDES QUI FONT PERDRE L''AMITIÉ DE DIEU","messageSource":"Pleinement Béni 6 - Message PMS","speakerName":"Apôtre Mohammed SANOGO","attendance":{"blooms":0,"adults":{"women":25,"men":27},"conversions":{"men":0,"women":0},"children":{"girls":9,"boys":9},"served":{"women":10,"men":10}},"newMembers":{"children":0,"women":0,"blooms":0,"men":6},"totalParticipants":70,"totalNewMembers":6}'::jsonb, '- Le son du piano était fort pendant le temps de direction
- Débordement de 02 mn du dirigeant 
- Son du piano fort pendant la prédication 
- Débordement de 30mn du temps de message 
- Prévoir la salle Annexe pour ECODIM 

', NULL, 'sz114r7pYo9ZbXcpza5O', '2025-01-26T13:08:11.217Z', '2026-06-14T00:37:30.370Z'),
('eef09a6d-2d8c-43e2-84b3-0b01519d8023', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-08-31', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"VAINCRE L’ÉCHEC","messageSource":"BOOST APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Thierry N''DOUFOU","attendance":{"blooms":0,"adults":{"men":43,"women":58},"served":{"women":18,"men":14},"conversions":{"women":0,"men":0},"children":{"girls":5,"boys":15}},"newMembers":{"women":0,"men":2,"children":0,"blooms":0},"totalParticipants":89,"totalNewMembers":2}'::jsonb, '•⁠  ⁠problème d’électricité dans les salles de l’ECODIM
•⁠  ⁠Problème sur la qualité du son du direct
', NULL, 't1VaLztGpwmeSPuoKdJs', '2025-09-04T17:52:04.786Z', '2026-06-14T00:37:30.507Z'),
('f470dcc6-e10b-49d7-b438-2306894365bc', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-06-01', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA PRIERE FERVENTE ","messageSource":"Apprend-moi à Prier: Apôtre MOHAMMED SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"children":{"girls":14,"boys":10},"adults":{"men":32,"women":53},"conversions":{"women":0,"men":0},"blooms":0,"served":{"men":17,"women":19}},"newMembers":{"women":4,"blooms":0,"children":0,"men":0},"totalParticipants":109,"totalNewMembers":4}'::jsonb, ' ⁠- Débordement du message de 25mn  
-Coupure d’électricité avant le culte.
. Problème au moment de l’annonce de C Pentecote : prévoir les détails des informations pour le pasteur 
TOUR 931 : 245000', NULL, 't4C6iSSNsv4kX3ppApPn', '2025-06-02T17:25:23.882Z', '2026-06-14T00:37:30.645Z'),
('2d38d1c5-8668-4771-9f0c-e3b992937e9f', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-04-26', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"2E CULTE: COMMENT METTRE EN PRIORITÉ LE SALUT DES ÂMES ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"women":60,"men":37},"conversions":{"women":0,"men":0},"served":{"women":28,"men":19},"children":{"girls":18,"boys":22},"blooms":0},"newMembers":{"men":0,"women":3,"blooms":0,"children":0},"totalParticipants":137,"totalNewMembers":3}'::jsonb, 'Observations : 
- Lancement du culte 20min en retard dû au débordement du 1er culte 
- Le tapis du centre était froissé, risque de faire tomber les gens 
- Bavardage com et gestion (Anaïs, Anne Esther, Yannick, Judicael) 
- Écho dans le son en ligne 
- Débordement de 21min 

Point des véhicules : 15
Voitures : 14
Moto : 1', NULL, 'tGpEpezwtxOkcx5LqDbu', '2026-04-26T13:49:10.381Z', '2026-06-14T00:37:30.786Z'),
('7e1023bd-0964-41a3-8f28-869588fe227c', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-06-14', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"2E CULTE: PARDONNER POUR ÊTRE  EXAUCÉ  ","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"children":{"boys":24,"girls":18},"served":{"women":22,"men":14},"adults":{"women":56,"men":39},"conversions":{"men":0,"women":0},"blooms":0},"newMembers":{"women":2,"children":0,"men":2,"blooms":0},"totalParticipants":137,"totalNewMembers":4}'::jsonb, 'Point des véhicules : 17
Voitures : 16
Motos : 1

Observations: 
	⁃	La prédication du pasteur a débordée de 26minutes 
	⁃	Débordement de 7 minutes pour le culte 
	⁃	Elysé Benian endormi à plusieurs reprises et ignorant les sensibilisations 
	⁃	Quelques porteurs de vie endormis 
    -  Le pianiste a servi en t shirt
', NULL, 'tIm3CzcevtJUfZXOrgnq', '2026-06-14T11:07:54.454Z', '2026-06-14T14:22:43.145Z'),
('8b282ec3-690a-44cb-9dc2-1474b9c17a7c', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-02-09', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"MONTER POUR RECEVOIR","messageSource":"08 HABITUDES POUR VOIR DIEU","speakerName":"Apôtre Mohammed SANOGO","attendance":{"conversions":{"women":1,"men":0},"children":{"boys":5,"girls":6},"served":{"men":8,"women":9},"adults":{"men":18,"women":26},"blooms":4},"newMembers":{"women":1,"men":1,"children":0,"blooms":4},"totalParticipants":59,"totalNewMembers":6}'::jsonb, 'Absence de nombreux serviteurs à la  prière des serviteurs : la prière des serviteurs n’est pas facultative 
•⁠  ⁠Débordement global de 10 mn 
•⁠  ⁠Coupure d’électricité répétitives (GE / protection des appareils )
•⁠  ⁠Débordement du message par le Pasteur  :20 m
•⁠  ⁠Lenteur à la projection des versets 
•⁠  ⁠Les chantres sont restés debout longtemps pendant le message 
•⁠  ⁠Préparer le retour de la sainte cène pour le ramassage après le service 
Un chargeur de pile à pris un coup. 
', NULL, 'tc1NiQnDW7wUHBg2weEZ', '2025-02-10T15:27:46.315Z', '2026-06-14T00:37:30.932Z'),
('699ca12b-52cf-4e25-b770-7ad87afa6adb', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-09-19', '9bf2d72a-c692-40ed-8c9b-8ff60986fb95', 'Matinale de Prières', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA PRIERE DE REQUETE","messageSource":"APPRENDS-MOI A PRIER : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"children":{"girls":0,"boys":0},"blooms":0,"served":{"men":0,"women":0},"conversions":{"men":0,"women":0},"adults":{"men":16,"women":6}},"newMembers":{"women":0,"men":0,"blooms":0,"children":0},"totalParticipants":22,"totalNewMembers":0}'::jsonb, NULL, NULL, 'tgImkKox1shoTJsghprl', '2025-09-26T11:32:01.590Z', '2026-06-14T00:37:31.073Z'),
('7fa9e005-6a0e-4ab9-a2b1-c05f89b86258', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-05-24', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"2E CULTE :LA PENTECOTE","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"conversions":{"men":0,"women":0},"adults":{"men":31,"women":79},"blooms":0,"served":{"men":16,"women":19},"children":{"boys":28,"girls":21}},"newMembers":{"children":0,"men":3,"blooms":0,"women":2},"totalParticipants":159,"totalNewMembers":5}'::jsonb, 'Point des véhicules : 16
Voitures : 15
Motos : 1

Observations: 
- Débordements global de 11 minutes du au temps de prédication.
- Soucis de son avec le micro de la dirigeante 
- La durée totale de la prédication pastorale est de 1heure12 minutes ,le temps prévu était de 1heure, il ya donc débordement de 12 minutes pour la prédication ', NULL, 'u9BmxpPeURHD00pWbagK', '2026-05-24T14:11:29.929Z', '2026-05-25T16:55:26.239Z'),
('af7fc398-3a8c-49ab-a784-919cd064e61c', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-12-03', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"REBATIR L''AUTEL INTERIEUR","messageSource":"JOUR 1 WISH WEEK 2025: PASTEUR LILIANE SANOGO","speakerName":"PASTEUR LILIABE SANOGO","attendance":{"adults":{"men":22,"women":32},"children":{"boys":4,"girls":2},"served":{"men":17,"women":17},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":60,"totalNewMembers":0}'::jsonb, 'Une erreur s’est produite lors de la distribution des médailles.
‎– La climatisation du côté des chantres n’était pas allumée.
‎- il n''y avait pas de bouteille d''eau dans le panier du pasteur
‎Debordement du culte de 06 mn
‎
', NULL, 'unZgX2qRHTgCsxZmDIhD', '2025-12-04T17:57:03.034Z', '2025-12-04T17:58:05.231Z'),
('7e2d4cbd-b886-4ef5-bdea-4536135b5005', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-03-15', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"AVOIR ET DEVELOPPER UN COEUR PUR ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":35,"women":52},"children":{"boys":22,"girls":20},"served":{"men":16,"women":22},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":1,"women":1,"blooms":0,"children":0},"totalParticipants":129,"totalNewMembers":2}'::jsonb, 'débordement de 12 minutes pour le culte
- ⁠la dirigeante n’est pas remontée après la sainte cène pour clôturer le culte ', NULL, 'v3We2TpxjzfzCVHazLlt', '2026-03-15T13:20:06.701Z', '2026-06-14T00:37:31.220Z'),
('98f70ece-b1aa-4638-b783-6ad10349d143', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-04-05', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA PAQUES ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":37,"women":70},"children":{"boys":17,"girls":23},"served":{"men":20,"women":27},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":2,"women":1,"blooms":0,"children":0},"totalParticipants":147,"totalNewMembers":3}'::jsonb, 'problème de sons entre la sono et la com 
- ⁠Vidéo de proclamation non lancée en raison du soucis de sons
- Débordement de 36 min observé en raison du temps de louange,et de la prédication. ', NULL, 'vdjcfZIxRtGaec0bIvu3', '2026-04-05T12:54:33.931Z', '2026-06-14T00:37:31.364Z'),
('5f8df71a-b0da-446c-8b19-f36a14484cc5', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-10-12', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'm6U2la5jyGO4fCWtCMCa', 'PST WILFRIED SEZAN', '{"messageTheme":"LA PRIÈRE QUI DEPLACE LES MONTAGNES","messageSource":"Apôtre  MOHAMMED SANOGO","speakerName":"Pasteur  ADOPO ","attendance":{"adults":{"men":27,"women":52},"children":{"boys":18,"girls":10},"served":{"men":12,"women":19},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":1,"women":3,"blooms":0,"children":0},"totalParticipants":107,"totalNewMembers":4}'::jsonb, '-Débordement global de 29 mn 

-Un micro s’est déchargé pendant l’intervention du modérateur : un chargeur de piles ne fonctionne pas correctement à corriger 
', '-Les fiches de recensement des âmes qui donnent leurs vies à Jésus sont finies : besoin à remonter à tata Blanche pour récupérer au siège 

-Prévoir d’acheter des parapluies pour l’église ', 'veStzXtzn1mO94YiRqWE', '2025-10-22T16:29:10.430Z', '2025-10-22T16:29:10.430Z'),
('cc2cf92e-4689-4ec9-bc2c-1ad27fc424fd', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-05-24', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"1ER CULTE: LA PENTECOTE ","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Apôtre Mohammed SANOGO","attendance":{"adults":{"men":29,"women":41},"children":{"boys":4,"girls":4},"served":{"men":16,"women":19},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":1,"women":1,"blooms":0,"children":0},"totalParticipants":78,"totalNewMembers":2}'::jsonb, 'Point des véhicules : 16
Voitures : 15 
Motos : 1

Observations: 
Retard de 42 min dans le lancement du culte dû à un retard de la com 
- Souci avec les télés au lancement du récap 
- Il n’y a pas eu de lien du culte 
- Débordement gblobal de 4min 

', NULL, 'vq51TOTotHZPprLMCW95', '2026-05-24T11:25:59.102Z', '2026-05-24T11:25:59.102Z'),
('e84f5357-d160-4b32-888e-b265ea020a87', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-06-14', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"1ER CULTE: PARDONNER POUR ÊTRE  EXAUCÉ  ","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":27,"women":53},"children":{"boys":6,"girls":3},"served":{"men":14,"women":22},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":89,"totalNewMembers":0}'::jsonb, 'Point des véhicules : 13
Voitures : 12
Motos : 1

Observations : 
- Problème de son avec le micro du dirigeant
- Plusieurs serviteurs devant le portail au lancement du culte
- Volume du son faible au début du culte
- Serviteurs de la sono pas en place au moment du dérèglement du son
- Débordement de la prédication 12 minutes
- Débordement général de 15 minutes
	⁃	Erreur de date sur la créa des olympiades', NULL, 'vzoS4kkK0xu80gnWWNby', '2026-06-14T11:07:55.155Z', '2026-06-14T14:25:13.760Z'),
('abe20397-11bb-43c8-83fa-74ed13906b28', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-04-28', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', NULL, 'Inconnu (ancien système)', '{"messageTheme":"BISOUS, CÂLINS, CARESSES, JUSQU’OÙ PEUT-ON ALLER DANS LES FIANÇAILLES ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":25,"women":29},"children":{"boys":2,"girls":1},"served":{"men":13,"women":18},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":57,"totalNewMembers":0}'::jsonb, 'Débordement de 1h12min ', NULL, 'wKa5RwnjxV28jm4H5yFp', '2026-04-29T12:03:35.913Z', '2026-06-14T00:37:31.501Z'),
('8fb5f165-7b7e-4496-b4b9-ecfe8b5632f5', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-08-06', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LE MYSTERE DU GRAIN DE SENEVE","messageSource":"LES 7 DETERMINANTS DE LA FOI: APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"conversions":{},"served":{"men":10,"women":9},"children":{"girls":3,"boys":6},"adults":{"women":23,"men":16},"blooms":0},"newMembers":{"blooms":0,"women":0,"children":0,"men":0},"totalParticipants":48,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Gestion des cultes en retard
•⁠  ⁠Débordement global de 20 mn', NULL, 'wXhLR27KDmfKGGNW8L2a', '2025-08-08T12:44:38.933Z', '2026-06-14T00:37:31.640Z'),
('2ba8f655-603f-4f94-a639-7e5fdb6caa5d', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-08-01', '6985bfef-b10d-4483-b032-7b3f8bde144f', 'Veillée de Prière', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LA PLUIE DE L''ARRIERE SAISON ","messageSource":"APOTRE MOHAMMED SANOGO","speakerName":"EVANGELISTE AZIALO","attendance":{"blooms":0,"conversions":{"men":0,"women":0},"adults":{"women":50,"men":25},"children":{"girls":10,"boys":9},"served":{"women":20,"men":15}},"newMembers":{"women":2,"men":2,"blooms":0,"children":0},"totalParticipants":94,"totalNewMembers":4}'::jsonb, NULL, NULL, 'yRv9ZKQXRFLQAIV1sPz6', '2025-08-05T14:58:49.815Z', '2026-06-14T00:37:31.778Z'),
('e38cc300-ead1-470b-b94d-c65ec5c60f77', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-09-14', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"LES DIFFERENTES SORTES DE PRIERE SUITE","messageSource":"APPRENDS-MOI A PRIER : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":29,"women":47},"children":{"boys":22,"girls":16},"served":{"men":13,"women":14},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":3,"women":1,"blooms":0,"children":0},"totalParticipants":114,"totalNewMembers":4}'::jsonb, '•⁠  ⁠Problème sur la qualité du son du micro du pasteur 
•⁠  ⁠L’annonce de l’événement du 05 Octobre n’était pas dans les GOODS News
•⁠  ⁠Débordement du culte de 26 mn du culte et 9 mn globalement 
•⁠  ⁠Attitude de la ressource en charge de la reception des nouveaux à corriger (distraite pendant la reception des nouveaux)
', NULL, 'yUAUPgoEaJgYgLlDLIpf', '2025-09-14T18:52:08.283Z', '2026-06-14T00:37:31.919Z'),
('17b7012d-384e-4a76-95a1-ec139d1eb85f', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-05-13', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"LES 3 R QUI PRÉCÈDENT LA VICTOIRE ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":17,"women":28},"children":{"boys":2,"girls":4},"served":{"men":12,"women":14},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":51,"totalNewMembers":0}'::jsonb, 'Point véhicule: 
Véhicules : 12
Moto :0

Commentaires : 
- Vidéo de proclamation non lancée par la com
- Soucis de son au début du lancement des good news
- Retard de 29 minutes en raison de temps de la prédication 
', NULL, 'yVcbng57oBNCFCv1Li8V', '2026-05-14T19:51:53.778Z', '2026-05-14T19:51:53.778Z'),
('22d9e2f8-9822-41d8-a973-d4f717590b8a', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-07-27', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"DE LA PART DE......","messageSource":"APPRENDS-MOI A PRIER : APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"conversions":{"women":0,"men":0},"adults":{"women":40,"men":24},"children":{"girls":16,"boys":20},"blooms":10,"served":{"women":19,"men":15}},"newMembers":{"men":3,"blooms":0,"women":26,"children":0},"totalParticipants":110,"totalNewMembers":29}'::jsonb, '•⁠  ⁠Débordement global de 14 mn 
•⁠  ⁠Sifflements (son de la télé ) 
•⁠  ⁠Problème avec le son du dirigeant , son bas
•⁠  ⁠Écho sur le son du micro du Pasteur 
•⁠  ⁠La gestion des cultes a oublié d’afficher le temps 
•⁠  ⁠Images de la caméra sur les écrans sombre à certains moments 
•⁠  ⁠Positionnement des chantres sur la chaire : avancer la chaire pour faciliter la circulation de la lead 
•⁠  ⁠Positionnement des portiers : les gens entraient dans le dos des portiers 

Points de suivi ( Rappel) 
•⁠  ⁠L’électricien doit également vérifier les leds côté batterie ( À faire mardi )
•⁠  ⁠Écouteurs à mettre à disposition pour le pianiste (À faire cette semaine) 
•⁠  ⁠Entretien cette semaine à faire pour éradiquer les moustiques (À faire cette semaine) 
', NULL, 'yWiywDqEYlzjcC3XwQyn', '2025-08-05T14:51:22.736Z', '2026-06-14T00:37:32.067Z'),
('4fe5ceaa-fbf1-4850-ad1d-c6bb5b7747ed', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-06-17', '645cea6d-2969-47c8-9e61-c0ec50f3518e', 'JEUNE ET PRIERE ', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"JOUR 3:SEIGNEUR,DÉTACHE- MOI POUR TON SERVICE.","messageSource":"Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":16,"women":26},"children":{"boys":1,"girls":4},"served":{"men":12,"women":18},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":0,"women":0,"blooms":0,"children":0},"totalParticipants":47,"totalNewMembers":0}'::jsonb, 'Point des véhicules : 9
Voitures : 8
Motos : 1

Observations: 
	⁃	Un élément du peuple en état d’ébriété mis hors de la salle du culte
	⁃	Absence du bateur 
	⁃	Débordement de 28 minutes pour le temps de la prédication 
	⁃	Débordement global de 25minutes pour le culte
', NULL, 'yhGpoDtZDrv28AHZL8LW', '2026-06-17T21:19:20.870Z', '2026-06-17T21:19:20.870Z'),
('8ab6559b-92c2-4f93-b5db-3a818cd9d43f', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2026-05-03', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', 'user_1785020879841_h3r2npq', 'LARRISSA BELLO', '{"messageTheme":"2EME CULTE : LE PAIN QUOTIDIEN ","messageSource":"Apôtre Mohammed SANOGO ","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":45,"women":65},"children":{"boys":15,"girls":20},"served":{"men":31,"women":30},"blooms":0,"conversions":{"men":0,"women":0}},"newMembers":{"men":3,"women":2,"blooms":0,"children":1},"totalParticipants":145,"totalNewMembers":6}'::jsonb, 'Point des véhicules : 15
Voitures : 13
Moto : 2

Observations : 
- Serviteurs qui dorment 
- Serviteurs qui bavardent ( GRace Khalil) (judicael com) 
- Débordement de 28 min du au débordement de temps du 1er culte , et au temps de prédication. 
', NULL, 'yxpq8SF3AZDyZKvH2NMb', '2026-05-03T13:35:56.584Z', '2026-05-03T23:32:56.097Z'),
('50d75352-3ef9-44f6-bb15-a9e02d319185', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2024-12-22', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"messageTheme":"DE LA POUSSIÈRE AU SOMMET: 4 ÉCOLES OU 5 GRÂCES ","messageSource":"DE LA POUSSIÈRE AU SOMMET: APOTRE MOHAMMED SANOGO ","speakerName":"Apôtre Mohammed SANOGO","attendance":{"adults":{"women":20,"men":17},"served":{"men":11,"women":11},"conversions":{"men":0,"women":0},"blooms":0,"children":{"girls":3,"boys":3}},"newMembers":{"children":0,"men":0,"women":0,"blooms":0},"totalParticipants":43,"totalNewMembers":0}'::jsonb, 'Débordement global de 32 mn 
Dirigeant : trop long a débordé de 4 mn 
Portiers : Attendre après la prière pour présenter le panier / Ligne des serviteurs non prise en compte / doivent rester concentrées quand elles sont devant attendant la prière pour les offrandes 
Chantres : Semblent perdues / Chant de bienvenue à fixer 
Sainte cène : se déploie trop tôt dans la salle dans la salle 
Prière des serviteurs : s’assurer d’être tous présents et impliqués dans la prière', NULL, 'zBbRwTcnok2bt8YEfyW6', '2025-05-24T11:05:26.721Z', '2026-06-14T00:37:32.213Z'),
('9826d027-379d-42bb-a0b4-b211e612f197', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-06-11', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"GARDER UNE VIE DE MEDITATION STABLE","messageSource":"APOTRE MOHAMMED SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"adults":{"men":13,"women":27},"children":{"girls":6,"boys":6},"blooms":0,"conversions":{"women":0,"men":0},"served":{"women":13,"men":12}},"newMembers":{"children":0,"women":0,"blooms":0,"men":0},"totalParticipants":52,"totalNewMembers":0}'::jsonb, '•⁠  ⁠Retard de lancement du culte du à la com qui n’était pas prête - câble défaillant - vidéo de proclamation n’avait pas un bon son 
•⁠  ⁠Dirigeant était occupé à la sono au lieu de se préparer à monter ', NULL, 'zgIgdagQ9MqU6dEqtwSG', '2025-06-16T18:01:02.508Z', '2026-06-14T00:37:32.359Z'),
('bdfc26fb-a89a-4d73-8901-435d008157cc', 'bergerie', 'worship', 'x3y3uiYTigvXbikv3UId', 'GESTION DES CULTES', NULL, '2025-07-02', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"messageTheme":"QUAND LA CORRECTION MENE AU REPOS","messageSource":"la sagesse du repos : Apôtre Mohammed SANOGO","speakerName":"Pasteur Wilfried SEZAN","attendance":{"served":{"men":10,"women":11},"conversions":{"men":0,"women":0},"adults":{"women":16,"men":12},"children":{"boys":3,"girls":3},"blooms":0},"newMembers":{"women":0,"men":0,"children":0,"blooms":0},"totalParticipants":34,"totalNewMembers":0}'::jsonb, NULL, NULL, 'zxgq5TqFnR1qafb7Q47j', '2025-07-08T04:48:53.998Z', '2026-06-14T00:37:32.498Z'),
('c2e4c3a8-ee09-413c-beab-2ce40a0ee5d4', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '2d76e32c-82d6-4d33-b989-42bab98b923f', '2025-08-17', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":2,"women":1},"visitorDecisions":{"undecided":2,"wantsToJoin":{"men":0,"women":1},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":3,"totalWantsToJoin":1,"totalWantsToGiveLifeToJesus":0}'::jsonb, 'LES 2 INDECIS FREQUENTENT DEJA UNE COMMUNAUTE VH', NULL, '3WRFoPwst57ywKfC5lKN', '2026-02-26T11:25:31.423Z', '2026-06-14T00:36:48.318Z'),
('91852516-b73e-4938-8114-82d18e029f12', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', 'd221cdad-7bfa-450f-918c-a9aa5a829e4c', '2025-10-26', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":1,"women":1},"visitorDecisions":{"undecided":1,"wantsToJoin":{"men":2,"women":0},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":2,"totalWantsToJoin":2,"totalWantsToGiveLifeToJesus":0}'::jsonb, NULL, NULL, '3djRLGzNV0cQMw7tak7m', '2025-11-16T20:52:52.302Z', '2025-11-16T20:52:52.302Z'),
('908a7df9-822b-4625-98ba-cdcf3a7efae1', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '91042592-b062-43ad-8ef1-26b1d3d8ec1e', '2025-11-09', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":1,"women":4},"visitorDecisions":{"undecided":2,"wantsToJoin":{"men":0,"women":2},"wantsToGiveLifeToJesus":{"men":0,"women":1}},"totalNewVisitors":5,"totalWantsToJoin":2,"totalWantsToGiveLifeToJesus":1}'::jsonb, '2 SONT VENUES SUITE A L''ÉVANGÉLISATION DE LA VEILLE ', NULL, '6FV95o8Di9ZQT67zBYpM', '2026-02-25T08:49:02.137Z', '2026-06-14T00:36:48.764Z'),
('e66b9412-46d5-4f5d-aa5c-f00cf34e6b12', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '22d9e2f8-9822-41d8-a973-d4f717590b8a', '2025-07-27', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":3,"women":4},"visitorDecisions":{"undecided":3,"wantsToJoin":{"men":1,"women":1},"wantsToGiveLifeToJesus":{"men":0,"women":1}},"totalNewVisitors":7,"totalWantsToJoin":2,"totalWantsToGiveLifeToJesus":1}'::jsonb, '2 sont déjà membre de VH', NULL, '70Jbpo0Vj7QCRQwPajY3', '2026-02-26T11:30:25.062Z', '2026-06-14T00:36:48.948Z'),
('4793932c-9792-4cbb-adf8-ab59b5cabe6b', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '30159747-f689-480d-a7e7-b2ce60727369', '2025-08-24', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":1,"women":2},"visitorDecisions":{"undecided":3,"wantsToJoin":{"men":0,"women":0},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":3,"totalWantsToJoin":0,"totalWantsToGiveLifeToJesus":0}'::jsonb, NULL, NULL, '7lqtvAlpnSPeIxKMlQbb', '2026-02-26T11:24:23.335Z', '2026-06-14T00:36:49.120Z'),
('622b3379-6ff4-4c9b-83d7-73fcc1c139fd', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '7c9edf55-cbda-49ad-a0ff-726b6558b43b', '2025-08-03', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":4,"women":4},"visitorDecisions":{"undecided":3,"wantsToJoin":{"men":1,"women":2},"wantsToGiveLifeToJesus":{"men":1,"women":0}},"totalNewVisitors":8,"totalWantsToJoin":3,"totalWantsToGiveLifeToJesus":1}'::jsonb, 'INDECIS DEJA MEMBRE DE VH ', NULL, '9WPnidVHvGleKiLtyIXp', '2026-02-26T11:28:10.014Z', '2026-06-14T00:36:49.305Z'),
('58fc6f21-a6a2-49ef-a9d4-96d8eeaa1f4a', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '2d76e32c-82d6-4d33-b989-42bab98b923f', '2025-08-17', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":2,"women":1},"visitorDecisions":{"undecided":2,"wantsToJoin":{"men":1,"women":0},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":3,"totalWantsToJoin":1,"totalWantsToGiveLifeToJesus":0}'::jsonb, NULL, NULL, '9cArzihiWKcnAyStLlKW', '2025-10-19T13:22:09.009Z', '2025-10-19T13:22:09.009Z'),
('4793a422-9983-4bf7-9874-09441fb64fb0', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', 'd4743546-3b51-4757-8543-1df960277580', '2026-05-31', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":8,"women":5},"visitorDecisions":{"undecided":9,"wantsToJoin":{"men":1,"women":1},"wantsToGiveLifeToJesus":{"men":1,"women":1}},"totalNewVisitors":13,"totalWantsToJoin":2,"totalWantsToGiveLifeToJesus":2}'::jsonb, '9 visiteurs de passage pour la présentation du bb', 'Support d''information de l''église
Code Qr sur une carte', 'A0QgSisgaBetYEAtmTsI', '2026-05-31T13:23:57.787Z', '2026-05-31T13:23:57.787Z'),
('52f89832-5907-4d29-856e-5ffc57109b4e', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '7c9edf55-cbda-49ad-a0ff-726b6558b43b', '2025-08-03', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":4,"women":4},"visitorDecisions":{"undecided":0,"wantsToJoin":{"men":1,"women":2},"wantsToGiveLifeToJesus":{"men":1,"women":0}},"totalNewVisitors":8,"totalWantsToJoin":3,"totalWantsToGiveLifeToJesus":1}'::jsonb, NULL, NULL, 'DT09XB4JQGYxyHGWu2m9', '2025-10-19T13:27:27.570Z', '2025-10-19T13:27:27.570Z'),
('273b6b3e-8991-4f6c-8718-5ccf43147883', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', 'c9112034-d43b-4ec9-af14-f2f1612bf466', '2026-05-10', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":1,"women":0},"visitorDecisions":{"undecided":0,"wantsToJoin":{"men":1,"women":0},"wantsToGiveLifeToJesus":{"men":1,"women":0}},"totalNewVisitors":1,"totalWantsToJoin":1,"totalWantsToGiveLifeToJesus":1}'::jsonb, 'Il n a pas de téléphone', NULL, 'DWlj6GpFyKCNBYjfX3LU', '2026-05-10T13:41:33.607Z', '2026-05-10T13:41:33.607Z'),
('970223ed-fb55-4fc2-ad67-263ca14e041b', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '7e2d4cbd-b886-4ef5-bdea-4536135b5005', '2026-03-15', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":1,"women":1},"visitorDecisions":{"undecided":0,"wantsToJoin":{"men":1,"women":1},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":2,"totalWantsToJoin":2,"totalWantsToGiveLifeToJesus":0}'::jsonb, 'Avoir une intimité réel avec DIEU
Avoir une situation régulière stable
Besoin de prier ', NULL, 'EZau96abb211xb5gNpuI', '2026-03-15T13:26:58.199Z', '2026-06-14T00:36:49.489Z'),
('58f4bd3a-38dc-4738-92a8-7cf80198bc73', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '296de74c-65e0-4cd6-bd1f-d23158dacc7b', '2026-06-07', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":1,"women":2},"visitorDecisions":{"undecided":0,"wantsToJoin":{"men":1,"women":2},"wantsToGiveLifeToJesus":{"men":1,"women":2}},"totalNewVisitors":3,"totalWantsToJoin":3,"totalWantsToGiveLifeToJesus":3}'::jsonb, NULL, NULL, 'FuYYUastd5kXPQJfbyd2', '2026-06-07T13:03:22.571Z', '2026-06-07T13:03:22.571Z'),
('80bfb0e5-f0a0-4360-b0d4-5c009d055726', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', 'eef09a6d-2d8c-43e2-84b3-0b01519d8023', '2025-08-31', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":2,"women":2},"visitorDecisions":{"undecided":2,"wantsToJoin":{"men":0,"women":0},"wantsToGiveLifeToJesus":{"men":0,"women":2}},"totalNewVisitors":4,"totalWantsToJoin":0,"totalWantsToGiveLifeToJesus":2}'::jsonb, NULL, NULL, 'I5TIygXdJtwV147HGJ2J', '2025-10-12T23:52:58.097Z', '2025-10-19T10:36:25.908Z'),
('24418677-226d-4c32-baba-fb6c264276e4', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '578c1d72-11c8-4f67-9a2f-15e51e7d13bf', '2025-07-13', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":0,"women":2},"visitorDecisions":{"undecided":0,"wantsToJoin":{"men":0,"women":2},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":2,"totalWantsToJoin":2,"totalWantsToGiveLifeToJesus":0}'::jsonb, NULL, NULL, 'J529IsmlCOGuRyw4fNnV', '2026-02-26T11:31:59.892Z', '2026-06-14T00:36:49.655Z'),
('781d703a-6f59-429d-8685-068d8e2d2dc6', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '07f51351-6ffe-46e2-8fef-d904c39ea75a', '2025-05-25', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":0,"women":2},"visitorDecisions":{"undecided":1,"wantsToJoin":{"men":0,"women":0},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":2,"totalWantsToJoin":0,"totalWantsToGiveLifeToJesus":0}'::jsonb, NULL, NULL, 'NeaudPMX8TUJes2NFnM0', '2025-11-16T21:12:53.775Z', '2025-11-16T21:12:53.775Z'),
('e82bac3a-a414-4840-a754-8b7fabdadddb', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '98f70ece-b1aa-4638-b783-6ad10349d143', '2026-04-05', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":2,"women":1},"visitorDecisions":{"undecided":1,"wantsToJoin":{"men":2,"women":0},"wantsToGiveLifeToJesus":{"men":2,"women":0}},"totalNewVisitors":3,"totalWantsToJoin":2,"totalWantsToGiveLifeToJesus":2}'::jsonb, 'La jeune fille est de passage, elle habite à Abobo Baoule. Nous allons la ANAKAZO.', NULL, 'PevSaFFKM1MXGykS6rCh', '2026-04-05T13:00:18.684Z', '2026-06-14T00:36:49.840Z'),
('57c48e0c-8e16-4023-9fe9-85915d2af120', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '04834f9c-2e77-4b27-b4f1-0749312e4b1a', '2026-05-17', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":0,"women":3},"visitorDecisions":{"undecided":1,"wantsToJoin":{"men":0,"women":2},"wantsToGiveLifeToJesus":{"men":0,"women":2}},"totalNewVisitors":3,"totalWantsToJoin":2,"totalWantsToGiveLifeToJesus":2}'::jsonb, NULL, NULL, 'PwyuS4L2VG3Q2bvhqq91', '2026-05-17T13:21:00.757Z', '2026-05-17T13:21:00.757Z'),
('29e5101e-41f2-43f7-99d4-3589c8f6e4aa', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', 'ea8bf60a-64c8-4954-948e-ec78832d13fa', '2025-11-02', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":1,"women":1},"visitorDecisions":{"undecided":0,"wantsToJoin":{"men":0,"women":0},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":2,"totalWantsToJoin":0,"totalWantsToGiveLifeToJesus":0}'::jsonb, 'Les 02 personnes étaient des cas sociaux qui ont été traités ce jour', NULL, 'Qd6v9GiqtbEYw5pD0E08', '2025-11-16T20:55:02.269Z', '2025-11-16T20:55:02.269Z'),
('19c74798-4668-4066-baa1-70276f3ed89c', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '5db259e3-f311-43f7-ae95-1f1f349ce4be', '2025-10-19', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":0,"women":0},"visitorDecisions":{"undecided":0,"wantsToJoin":{"men":0,"women":0},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":0,"totalWantsToJoin":0,"totalWantsToGiveLifeToJesus":0}'::jsonb, NULL, NULL, 'RguZ6tVhLFpdiK67Igqi', '2025-11-16T19:51:41.674Z', '2025-11-16T19:51:41.674Z'),
('7cbf01a2-2f72-4774-8562-e431392361fb', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', 'f470dcc6-e10b-49d7-b438-2306894365bc', '2025-06-01', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":0,"women":4},"visitorDecisions":{"undecided":1,"wantsToJoin":{"men":0,"women":1},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":4,"totalWantsToJoin":1,"totalWantsToGiveLifeToJesus":0}'::jsonb, '02 sont en vacances et vivent à l''étranger', NULL, 'T6nvuHw9GsQiVKBx5Jsw', '2025-11-16T21:15:19.401Z', '2025-11-16T21:15:19.401Z'),
('429930f2-5dae-4758-948e-e6f12c60d212', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '42cc37f8-d413-492c-baa3-8a40c0caa5bc', '2026-03-29', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":1,"women":1},"visitorDecisions":{"undecided":0,"wantsToJoin":{"men":0,"women":1},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":2,"totalWantsToJoin":1,"totalWantsToGiveLifeToJesus":0}'::jsonb, NULL, NULL, 'Tk2J96Reb38soan7dWcr', '2026-03-29T22:33:02.742Z', '2026-06-14T00:36:50.022Z'),
('f150b0e7-b2de-428b-9a0a-2b1c7e42d671', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '4b69b079-09b7-4048-aa64-b87c56ea34aa', '2025-09-21', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":1,"women":2},"visitorDecisions":{"undecided":2,"wantsToJoin":{"men":0,"women":1},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":3,"totalWantsToJoin":1,"totalWantsToGiveLifeToJesus":0}'::jsonb, NULL, NULL, 'UendpsCUdieeNRIDLUBr', '2025-10-12T23:44:48.245Z', '2025-10-19T10:36:34.594Z'),
('b0d2bd6e-aac0-4022-b071-5e2017774e10', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '41a04f05-e3bc-4f81-ae70-dc11219a2199', '2026-01-25', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":1,"women":3},"visitorDecisions":{"undecided":1,"wantsToJoin":{"men":1,"women":2},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":4,"totalWantsToJoin":3,"totalWantsToGiveLifeToJesus":0}'::jsonb, '1 INDECIS ', NULL, 'W96TUKJfB1U8onZJX3Ev', '2026-02-25T08:34:23.824Z', '2026-06-14T00:36:50.181Z'),
('fb4a8acd-2899-408b-825b-4dfedbc15ab6', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '7588a8fa-181f-4cf8-bc17-59f8c97b3f0a', '2025-07-20', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":0,"women":6},"visitorDecisions":{"undecided":3,"wantsToJoin":{"men":0,"women":3},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":6,"totalWantsToJoin":3,"totalWantsToGiveLifeToJesus":0}'::jsonb, NULL, NULL, 'XL4l0CKum7820ez1BRn1', '2026-02-26T11:31:15.694Z', '2026-06-14T00:36:50.341Z'),
('6748d183-81c0-4f23-855e-925e3eedcfdc', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '8d7cd2cc-7af1-4772-99ea-eca14ca399fc', '2026-05-03', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":5,"women":10},"visitorDecisions":{"undecided":7,"wantsToJoin":{"men":3,"women":5},"wantsToGiveLifeToJesus":{"men":3,"women":3}},"totalNewVisitors":15,"totalWantsToJoin":8,"totalWantsToGiveLifeToJesus":6}'::jsonb, NULL, NULL, 'Y3o00zukvTWWlZHoGGfd', '2026-05-03T13:08:26.396Z', '2026-05-03T13:08:26.396Z'),
('477b159b-ad04-4fff-aac2-0ed7bab05725', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '0bc97b35-6377-474d-a2fc-56ed3026de20', '2025-08-10', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":5,"women":4},"visitorDecisions":{"undecided":8,"wantsToJoin":{"men":1,"women":0},"wantsToGiveLifeToJesus":{"men":1,"women":0}},"totalNewVisitors":9,"totalWantsToJoin":1,"totalWantsToGiveLifeToJesus":1}'::jsonb, NULL, NULL, 'Ydh57gIqzdgGCkDn2rUc', '2025-10-19T13:25:14.244Z', '2025-10-19T13:25:14.244Z'),
('be9765a7-5f72-4388-a412-bf51c2d535ec', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '22d9e2f8-9822-41d8-a973-d4f717590b8a', '2025-07-27', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":3,"women":4},"visitorDecisions":{"undecided":5,"wantsToJoin":{"men":1,"women":0},"wantsToGiveLifeToJesus":{"men":0,"women":1}},"totalNewVisitors":7,"totalWantsToJoin":1,"totalWantsToGiveLifeToJesus":1}'::jsonb, NULL, NULL, 'YtWQf512MLFeTlcdFqtd', '2025-10-19T13:39:14.752Z', '2025-10-19T13:39:14.752Z'),
('d526b43c-ff65-434c-b47c-e1c8890366e6', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '1b20974a-56d6-4d6f-a470-b43004d5104d', '2026-01-18', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":2,"women":3},"visitorDecisions":{"undecided":2,"wantsToJoin":{"men":2,"women":1},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":5,"totalWantsToJoin":3,"totalWantsToGiveLifeToJesus":0}'::jsonb, NULL, NULL, 'aByM0xGqTNPJe0xGbqtB', '2026-02-25T08:35:51.841Z', '2026-06-14T00:36:50.522Z'),
('5944b453-0b89-4e6f-b51f-d6b2245bb90f', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '0bc97b35-6377-474d-a2fc-56ed3026de20', '2025-08-10', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":5,"women":4},"visitorDecisions":{"undecided":8,"wantsToJoin":{"men":1,"women":0},"wantsToGiveLifeToJesus":{"men":1,"women":0}},"totalNewVisitors":9,"totalWantsToJoin":1,"totalWantsToGiveLifeToJesus":1}'::jsonb, NULL, NULL, 'b5S6hSfEhjoZ5LtfmB1Y', '2026-02-26T11:26:46.715Z', '2026-06-14T00:36:50.661Z'),
('10a12897-be9a-4383-b440-b62dbad13b04', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', 'f5f2c26a-036f-4748-a266-4d5ce4186c8a', '2026-03-22', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":3,"women":1},"visitorDecisions":{"undecided":0,"wantsToJoin":{"men":3,"women":0},"wantsToGiveLifeToJesus":{"men":2,"women":0}},"totalNewVisitors":4,"totalWantsToJoin":3,"totalWantsToGiveLifeToJesus":2}'::jsonb, NULL, NULL, 'bOWOeevUcLhnRchPavlX', '2026-03-22T13:33:21.393Z', '2026-06-14T00:36:50.842Z'),
('c7a35d44-caa2-41ff-bf78-8d4c44eb8616', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '5f8df71a-b0da-446c-8b19-f36a14484cc5', '2025-10-12', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":3,"women":1},"visitorDecisions":{"undecided":0,"wantsToJoin":{"men":1,"women":3},"wantsToGiveLifeToJesus":{"men":1,"women":1}},"totalNewVisitors":4,"totalWantsToJoin":4,"totalWantsToGiveLifeToJesus":2}'::jsonb, NULL, NULL, 'ckoFfatNWfg7KQ44dgjf', '2025-11-16T19:46:29.677Z', '2025-11-16T19:46:29.677Z'),
('b7fcb114-f6ef-4b7b-9285-f75a4960655c', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '8e21df60-5bed-4470-87c3-a01f5c15bc97', '2026-01-11', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":2,"women":2},"visitorDecisions":{"undecided":1,"wantsToJoin":{"men":1,"women":2},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":4,"totalWantsToJoin":3,"totalWantsToGiveLifeToJesus":0}'::jsonb, NULL, NULL, 'dQpblHsKH3b9GMzJObEa', '2026-02-25T08:36:42.117Z', '2026-06-14T00:36:51.021Z'),
('80c3acfd-662d-4cf0-b2c6-f2d44382fb58', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', 'e38cc300-ead1-470b-b94d-c65ec5c60f77', '2025-09-14', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"visitorDecisions":{"wantsToJoin":{"women":1,"men":1},"undecided":2,"wantsToGiveLifeToJesus":{"women":0,"men":0}},"totalNewVisitors":4,"totalWantsToJoin":2,"totalWantsToGiveLifeToJesus":0,"newVisitors":{"men":3,"women":1}}'::jsonb, NULL, NULL, 'eSXjhLAnIHxvBYLAS69c', '2025-09-29T00:01:01.669Z', '2025-10-19T10:36:39.599Z'),
('c3c64638-4376-4375-a286-71e38ebff7c4', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '4b5a4efb-bf67-4a99-af6f-39b35a8d136c', '2026-02-01', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":5,"women":1},"visitorDecisions":{"undecided":2,"wantsToJoin":{"men":3,"women":1},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":6,"totalWantsToJoin":4,"totalWantsToGiveLifeToJesus":0}'::jsonb, '1 MEMBRE EST PARTIE PLUTOT ', NULL, 'gqkntJru3Uj9ioLblgNg', '2026-02-25T08:33:02.788Z', '2026-06-14T00:36:51.162Z'),
('0f92f73c-7d19-4470-9ba1-b01848047c69', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '1d2891de-e0ca-487d-a152-be003fba5733', '2026-03-08', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":2,"women":2},"visitorDecisions":{"undecided":2,"wantsToJoin":{"men":1,"women":0},"wantsToGiveLifeToJesus":{"men":1,"women":0}},"totalNewVisitors":4,"totalWantsToJoin":1,"totalWantsToGiveLifeToJesus":1}'::jsonb, 'Deux personnes  viennent des ÉGLISES SŒURS DE YOTSAR et  deux DOSTA', NULL, 'hNWgYX4ZiVjdL7qTxMKA', '2026-03-08T12:42:09.053Z', '2026-06-14T00:36:51.305Z'),
('86bcad85-8c18-4cac-aaea-59dc03bc0962', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '30159747-f689-480d-a7e7-b2ce60727369', '2025-08-24', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"totalWantsToJoin":0,"totalWantsToGiveLifeToJesus":0,"updatedBy":"xJCBIxNrhTDjVget9PQf","visitorDecisions":{"undecided":3,"wantsToGiveLifeToJesus":{"men":0,"women":0},"wantsToJoin":{"women":0,"men":0}},"newVisitors":{"women":2,"men":1},"totalNewVisitors":3}'::jsonb, NULL, NULL, 'iXcFsjbGupOxlqgMq4sE', '2025-10-12T23:53:59.934Z', '2025-10-19T13:20:16.117Z'),
('cb95cea4-3241-484f-967e-0ac09e16356b', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '2625aff2-9126-4a83-a3b8-33f654246b86', '2025-12-28', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":1,"women":4},"visitorDecisions":{"undecided":2,"wantsToJoin":{"men":1,"women":2},"wantsToGiveLifeToJesus":{"men":0,"women":1}},"totalNewVisitors":5,"totalWantsToJoin":3,"totalWantsToGiveLifeToJesus":1}'::jsonb, 'PERSONNES N''EST VENUE SUITE A L''EVANGÉLISATION ', NULL, 'kJ5xC88OQB86yqTy4oBa', '2026-02-25T08:38:38.151Z', '2026-06-14T00:36:51.466Z'),
('27ba635f-3694-44d2-a4f3-ad7449b5726a', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '6bf3ca89-d6d5-45d9-9f3e-de1d0d64b4af', '2025-11-23', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":4,"women":6},"visitorDecisions":{"undecided":2,"wantsToJoin":{"men":3,"women":3},"wantsToGiveLifeToJesus":{"men":1,"women":1}},"totalNewVisitors":10,"totalWantsToJoin":6,"totalWantsToGiveLifeToJesus":2}'::jsonb, '2 SONT VENUES A LA SUITE DE L''EVANGELISATION ', NULL, 'mPtbPy7ht427aNxWB5NF', '2026-02-25T08:44:56.784Z', '2026-06-14T00:36:51.626Z'),
('08e642c9-69be-450e-a423-9a981ba6b78d', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '1bbc1678-2359-49bb-ae93-2ce2b3a3c2eb', '2025-09-07', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":2,"women":2},"visitorDecisions":{"undecided":3,"wantsToJoin":{"men":0,"women":0},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":4,"totalWantsToJoin":0,"totalWantsToGiveLifeToJesus":0}'::jsonb, NULL, NULL, 'nbjb8RxCtHtDDvyFzRW1', '2025-10-12T23:47:08.176Z', '2025-10-19T10:36:53.207Z'),
('1ec0e15c-1051-40bd-b940-2c66caffa137', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '04834f9c-2e77-4b27-b4f1-0749312e4b1a', '2026-05-17', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":0,"women":3},"visitorDecisions":{"undecided":1,"wantsToJoin":{"men":0,"women":2},"wantsToGiveLifeToJesus":{"men":0,"women":2}},"totalNewVisitors":3,"totalWantsToJoin":2,"totalWantsToGiveLifeToJesus":2}'::jsonb, NULL, NULL, 'nf8gntwMHQdRtmsTQp5p', '2026-05-17T13:21:03.089Z', '2026-05-17T13:21:03.089Z'),
('41d9b95f-3d3b-48bd-b8b5-2fac50d5925e', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '946dfd3e-b43c-41d6-89c8-86d36426bd51', '2026-04-19', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":3,"women":1},"visitorDecisions":{"undecided":1,"wantsToJoin":{"men":2,"women":0},"wantsToGiveLifeToJesus":{"men":2,"women":0}},"totalNewVisitors":4,"totalWantsToJoin":2,"totalWantsToGiveLifeToJesus":2}'::jsonb, '- 1 femme résident a cocody
- 1 catholique veut donner sa vie à Jesus veut intégrer
- 1 veut donner à Jesus veut intégrer
- 1 stagiaire de porteur de vie de l église de Abobo baoulé', NULL, 'oIjDHgpk9C5uhqRjQVGf', '2026-04-19T14:33:18.717Z', '2026-06-14T00:36:51.764Z'),
('251718bf-fcbf-46c2-973f-6acd444924e4', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '89bc2e3d-ee6f-44e4-a92b-290519f1100e', '2025-12-21', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":4,"women":1},"visitorDecisions":{"undecided":0,"wantsToJoin":{"men":0,"women":1},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":5,"totalWantsToJoin":1,"totalWantsToGiveLifeToJesus":0}'::jsonb, '4 JEUNES DE LA RUE SONT VENUES À LA SUITE DE UTT. ', NULL, 'omOPjuxXMUslCBr0cXpi', '2026-02-25T08:40:07.929Z', '2026-06-14T00:36:51.934Z'),
('17f548af-5612-4aa2-b817-83cfe9f040f1', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '54896d20-094d-4a65-bf37-cd56cdfe7b98', '2026-04-12', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":0,"women":2},"visitorDecisions":{"undecided":2,"wantsToJoin":{"men":0,"women":0},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":2,"totalWantsToJoin":0,"totalWantsToGiveLifeToJesus":0}'::jsonb, 'La famille Cephas était de service
La soeur Grace est de Kodesh et veux observer avant de devenir membre de AGC
Jeanne Estelle est de ADD juste en visite
Amen', NULL, 'opv4kMUkFuLvsuE1iQEa', '2026-04-12T12:44:00.287Z', '2026-06-14T00:36:52.109Z'),
('77a625cb-3f0f-45a6-abdc-4fa9b237205a', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '8cbf331e-f9bc-4c66-b908-a5c5fcf24239', '2026-03-01', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":2,"women":2},"visitorDecisions":{"undecided":0,"wantsToJoin":{"men":4,"women":0},"wantsToGiveLifeToJesus":{"men":2,"women":2}},"totalNewVisitors":4,"totalWantsToJoin":4,"totalWantsToGiveLifeToJesus":4}'::jsonb, NULL, NULL, 'p9I78csO2lgFpDeWiaKW', '2026-03-01T13:40:31.997Z', '2026-06-14T00:36:52.281Z'),
('41ce3424-aa92-4261-875d-e4212852f93c', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '6ecc8b07-0189-40f6-9c94-cd0c000584a3', '2025-12-07', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":1,"women":2},"visitorDecisions":{"undecided":2,"wantsToJoin":{"men":0,"women":0},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":3,"totalWantsToJoin":0,"totalWantsToGiveLifeToJesus":0}'::jsonb, '1 CAS SOCIALE ', NULL, 'py6r8Z7BitUoNrlUwzVO', '2026-02-25T08:41:20.140Z', '2026-06-14T00:36:52.454Z'),
('358cea79-6649-48b7-9051-7b2a44eb80be', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '0017a4a0-fc2d-4862-a6e3-02d0cb0c95f9', '2025-05-11', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":3,"women":4},"visitorDecisions":{"undecided":1,"wantsToJoin":{"men":2,"women":1},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":7,"totalWantsToJoin":3,"totalWantsToGiveLifeToJesus":0}'::jsonb, NULL, NULL, 'q2EVWZ4amgYRSNqM0SWh', '2025-11-16T21:08:07.515Z', '2025-11-16T21:08:07.515Z'),
('f6e2fbcf-5098-4d3e-ac54-9e1be228f621', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '5a6f3fa1-98f4-4aa9-87b4-6d229cc6ce50', '2026-02-08', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":1,"women":5},"visitorDecisions":{"undecided":3,"wantsToJoin":{"men":1,"women":2},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":6,"totalWantsToJoin":3,"totalWantsToGiveLifeToJesus":0}'::jsonb, '1 N''A PAS REPONDU ', NULL, 'qtuAE3LdEvryilW3Ehp8', '2026-02-25T08:31:38.353Z', '2026-06-14T00:36:52.602Z'),
('dfac8a1b-10f0-45f5-83f4-dc7e19f50848', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '6968898e-a9de-48f6-84c1-b9939442f7fb', '2026-02-22', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":0,"women":3},"visitorDecisions":{"undecided":0,"wantsToJoin":{"men":0,"women":3},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":3,"totalWantsToJoin":3,"totalWantsToGiveLifeToJesus":0}'::jsonb, NULL, NULL, 'rK9MGIdpJsSTtyJ3cjUX', '2026-02-22T14:45:26.379Z', '2026-06-14T00:36:52.776Z'),
('0732a801-8ccb-4b3c-a0e2-b70b7f451f9f', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '907ad504-8c6c-4237-a330-93641928280d', '2025-05-18', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":4,"women":5},"visitorDecisions":{"undecided":1,"wantsToJoin":{"men":2,"women":3},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":9,"totalWantsToJoin":5,"totalWantsToGiveLifeToJesus":0}'::jsonb, NULL, NULL, 'tNiU5lyOn5vyz7mTXxu2', '2025-11-16T21:11:45.647Z', '2025-11-16T21:11:45.647Z'),
('d18cd776-8232-40a1-adc3-1883967e6ad4', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', 'eef09a6d-2d8c-43e2-84b3-0b01519d8023', '2025-08-31', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":2,"women":2},"visitorDecisions":{"undecided":2,"wantsToJoin":{"men":0,"women":2},"wantsToGiveLifeToJesus":{"men":0,"women":2}},"totalNewVisitors":4,"totalWantsToJoin":2,"totalWantsToGiveLifeToJesus":2}'::jsonb, 'LES 2 INDECIS SONT MEMBRE DE VH DOKOUI', NULL, 'tlmgfXOKDM01KSr2l0LC', '2026-02-26T11:23:12.818Z', '2026-06-14T00:36:52.948Z'),
('45c5ec99-0748-46fc-b0df-ff0ab12f9222', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '8013c916-2429-4542-9c76-3010ba5d02d6', '2025-09-28', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"visitorDecisions":{"wantsToJoin":{"men":1,"women":1},"undecided":1,"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalWantsToGiveLifeToJesus":0,"totalNewVisitors":3,"newVisitors":{"women":2,"men":1},"totalWantsToJoin":2,"updatedBy":"xJCBIxNrhTDjVget9PQf"}'::jsonb, 'RAS', NULL, 'u1fMA5dC9FG6ARKHc7cC', '2025-09-28T23:59:02.555Z', '2025-10-19T10:38:02.868Z'),
('65a90154-5fe3-4ad2-86b4-51d05914bc2b', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '626193ad-009e-4116-a480-67cc5e34894b', '2025-11-30', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":3,"women":4},"visitorDecisions":{"undecided":2,"wantsToJoin":{"men":2,"women":3},"wantsToGiveLifeToJesus":{"men":0,"women":3}},"totalNewVisitors":7,"totalWantsToJoin":5,"totalWantsToGiveLifeToJesus":3}'::jsonb, '4 SONT VENUES A LA SUITE DE L''EVANGELISATION ', NULL, 'uX9McZ3D95F4CD0gFOdg', '2026-02-25T08:43:26.802Z', '2026-06-14T00:36:53.091Z'),
('322ae2fa-ed06-40f5-a4ce-50792203ba6e', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '9767f97a-fdf3-44bc-8011-17663235a609', '2025-11-16', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":3,"women":1},"visitorDecisions":{"undecided":1,"wantsToJoin":{"men":3,"women":0},"wantsToGiveLifeToJesus":{"men":2,"women":0}},"totalNewVisitors":4,"totalWantsToJoin":3,"totalWantsToGiveLifeToJesus":2}'::jsonb, '4 SONT VENUES À LA SUITE DE L''EVANGÉLISATION ', NULL, 'udl1hAxg2k0W7KwjELjg', '2026-02-25T08:46:19.880Z', '2026-06-14T00:36:53.263Z'),
('49d1dc8f-2b63-4bfc-ba1f-61e0fc5795d0', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '403d5c99-09af-4cd5-ae1d-92395bfd1422', '2026-02-15', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":2,"women":5},"visitorDecisions":{"undecided":3,"wantsToJoin":{"men":0,"women":4},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":7,"totalWantsToJoin":4,"totalWantsToGiveLifeToJesus":0}'::jsonb, '3 SONT DE PASSAGES', NULL, 'w4Iru1NDLMO87voTONvI', '2026-02-25T08:29:56.912Z', '2026-06-14T00:36:53.425Z'),
('39f75d62-e5e2-41cf-b829-b63fea9431e2', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', 'd79bc7d8-65c0-446a-9d37-7a18010156af', '2026-06-07', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"newVisitors":{"men":0,"women":2},"visitorDecisions":{"undecided":1,"wantsToJoin":{"men":0,"women":2},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":2,"totalWantsToJoin":2,"totalWantsToGiveLifeToJesus":0}'::jsonb, 'Elle dit etre de passage mais nous devons l''anakazo.', NULL, 'wJh6EZg5JOLxFw3xzhc2', '2026-06-07T13:01:20.434Z', '2026-06-07T13:01:20.434Z'),
('124b1544-b39d-46d7-91e9-86686ae079c2', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '1bbc1678-2359-49bb-ae93-2ce2b3a3c2eb', '2025-09-07', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":2,"women":2},"visitorDecisions":{"undecided":3,"wantsToJoin":{"men":0,"women":1},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":4,"totalWantsToJoin":1,"totalWantsToGiveLifeToJesus":0}'::jsonb, 'LES 3 INDECIS VIENNENT DES AD', NULL, 'xhm2gawvMWNm5vVH6Aou', '2026-02-26T11:21:28.073Z', '2026-06-14T00:36:53.563Z'),
('14e4d396-63e5-445a-86d6-417374df6a6b', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '37255aa0-dae3-4b2a-ac24-1536dcbd7f99', '2025-07-06', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":6,"women":6},"visitorDecisions":{"undecided":2,"wantsToJoin":{"men":1,"women":1},"wantsToGiveLifeToJesus":{"men":0,"women":0}},"totalNewVisitors":12,"totalWantsToJoin":2,"totalWantsToGiveLifeToJesus":0}'::jsonb, '8 sont de passage par rapport à la migration à MH ', NULL, 'yaiVStiaEdhrg6TBYyJp', '2026-02-26T11:33:53.336Z', '2026-06-14T00:36:53.706Z'),
('c87a6b14-d0aa-474a-a0f9-7171ef3d479b', 'bergerie', 'adn', '43RfvwVIY8INqang0vKp', 'AMIS DES NOUVEAUX', '2d38d1c5-8668-4771-9f0c-e3b992937e9f', '2026-04-26', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"newVisitors":{"men":0,"women":4},"visitorDecisions":{"undecided":0,"wantsToJoin":{"men":0,"women":4},"wantsToGiveLifeToJesus":{"men":0,"women":1}},"totalNewVisitors":4,"totalWantsToJoin":4,"totalWantsToGiveLifeToJesus":1}'::jsonb, '3 femmes qui veulent intégrer la famille
1 une qui est en visite venue de la riviera 3 invitée par mme Kouassi', NULL, 'zneibZjOuCbq64hGRzLN', '2026-04-26T14:08:53.391Z', '2026-06-14T00:36:53.887Z'),
('d4520ee0-1c64-4ab4-a723-d05eb8778a5d', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '055bcef1-b698-4260-b14f-d1d1b3e87222', '2026-04-01', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":0,"regularOfferings":45500,"specialOfferings":0},"totalFinances":45500}'::jsonb, NULL, NULL, '0GEAkaqMNmN5vMqcnHWc', '2026-04-02T22:43:55.264Z', '2026-06-14T00:36:54.307Z'),
('c63436f3-74e4-42f1-91ad-39b0c63001e0', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '3947f909-016e-40f5-bcc3-66353339addb', '2026-07-08', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":0,"regularOfferings":22600,"specialOfferings":100000},"totalFinances":122600}'::jsonb, 'Les offrandes spéciales de cent (100000) francs sont destinées à la campagne IN SENEGAL.

Nous rendons grâce à DIEU notre Père.', NULL, '16GfJYX9iFpuSbmM6VeD', '2026-07-08T20:55:56.973Z', '2026-07-08T20:55:56.973Z'),
('c5bdcdf6-27f8-4e0b-8704-a9088e56afcb', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '7e2d4cbd-b886-4ef5-bdea-4536135b5005', '2026-03-15', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":78500,"regularOfferings":288395,"specialOfferings":100000},"totalFinances":466895}'::jsonb, 'L''offrande speciale de cent ( 100000 ) milles Fcfa est une semence au Pasteur W. SEZAN. La somme lui a été remise.', NULL, '1aZx51K4h0zxJHeiq7aL', '2026-03-15T13:33:35.303Z', '2026-06-14T00:36:54.492Z'),
('f394895f-8b55-4551-b3c1-480f007c3408', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '235b3427-92c9-4466-8553-dd5fdd56699e', '2026-05-31', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":417500,"regularOfferings":174405,"specialOfferings":20500},"totalFinances":612405}'::jsonb, 'Les offrandes spéciales de 20.500 sont reparties comme suit: 10500f semence AGC et 10 000f semence C''Pentecôte.
Point des 1er et 2eme culte:
Dimes: 852 700+ 417 500= 1 270 200fcfa
Offrandes: 132 500+ 174 405= 306 905 fcfa
Offrandes spéciales: 829 150+ 20 500 = 849 650fcfa
Total géneral 1er et 2eme cultes
1 270 200 + 306 905+ 849 650= 2 426 755 fcfa.
Que toute la gloire revienne à notre Seigneur JESUS CHRIST.', NULL, '2D3vygcPAMa8QSBGOHIC', '2026-05-31T15:47:22.512Z', '2026-06-14T00:36:54.647Z'),
('7385e7c9-6cfb-49d4-955f-83795fadba82', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2026-02-25', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":553500,"regularOfferings":72980,"specialOfferings":0},"totalFinances":626480}'::jsonb, 'RAS', NULL, '2MvaFCAoahpw8LEXxsXL', '2026-02-26T00:42:02.588Z', '2026-06-14T00:36:54.806Z'),
('f9250deb-eaf9-4f47-9619-44ddf211dc76', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '5ad7bef2-9829-4a5b-98ac-9e09751bb501', '2026-03-17', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":200000,"regularOfferings":32000,"specialOfferings":0},"totalFinances":232000}'::jsonb, 'Toute la Gloire à DIEU notre Père', NULL, '2gSComgJyvg73oqdPtds', '2026-03-20T06:38:11.070Z', '2026-06-14T00:36:54.962Z'),
('45d535b1-9542-4357-bff0-7c2d70e9ec13', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '2d38d1c5-8668-4771-9f0c-e3b992937e9f', '2026-04-26', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":0,"regularOfferings":177750,"specialOfferings":312000},"totalFinances":489750}'::jsonb, 'Aucune dîme enregistrée. Les offrandes spéciales de 312000 sont destinées au Tour 931
Etat des offrandes pour le 1er et le 2ème.culte
Dîmes: 26500
Offrandes: 122100 + 177750 = 299 850 fcfa
Offrandes spéciales: 479000 + 321000= 791 000 fcfa
Total général: 26500 + 299850 + 791000= 1 117 350 fcfa
Merci Seigneur pour tes grâces.', NULL, '2jE2zetcWWrOQKi71k4B', '2026-04-26T16:15:45.390Z', '2026-06-14T00:36:55.111Z'),
('cfa1f5db-fccb-4eb2-a32a-ca8287a8f5d9', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '930bb152-1adb-4377-a095-414f390e1029', '2025-10-29', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":345000,"regularOfferings":31500,"specialOfferings":765000},"totalFinances":1141500}'::jsonb, NULL, NULL, '36PFbiaLeFQaDyiemTbs', '2025-10-30T08:00:52.454Z', '2026-06-14T00:36:55.274Z'),
('ea649861-a805-4f9a-9c24-72f83cbc8340', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '1793b218-2446-4e63-8fc3-22115d36be3f', '2026-03-04', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":428600,"regularOfferings":38195,"specialOfferings":0},"totalFinances":466795}'::jsonb, '14000 POUR CJS ', NULL, '3wyiWQ6GVPXLP2vQfFtC', '2026-03-05T17:35:07.918Z', '2026-06-14T00:36:55.417Z'),
('930ab471-9386-4103-9083-658c21ef8bcf', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-09-03', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":80000,"specialOfferings":0,"regularOfferings":16500},"totalFinances":96500}'::jsonb, '•⁠  ⁠Absence de portiers 
•⁠  ⁠Débordement 16 mn 
•⁠  ⁠Son du lead fort 
•⁠  ⁠Pas de son au micro du Pasteur à sa montée 
•⁠  ⁠Problème de son au lancement du culte
', NULL, '40OOeKWT1xSJUfhT4cy1', '2025-09-05T05:03:25.866Z', '2026-06-14T00:36:55.589Z'),
('bce78e2c-c9c9-4014-9e15-d3ab8257650a', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-07-30', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":130000,"specialOfferings":0,"regularOfferings":24100},"totalFinances":154100}'::jsonb, '•⁠  ⁠Chantre en retard 
•⁠  ⁠Son de la lead fort 
•⁠  ⁠Coupure d’électricité à la fin du message 
•⁠  ⁠Débordement global de 20 mn
', NULL, '4V3nlUvrHv0G7DS9Ci6u', '2025-08-05T14:55:04.728Z', '2026-06-14T00:36:55.770Z'),
('3bf071ff-5d87-4316-ac43-59a024efa95e', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '42cc37f8-d413-492c-baa3-8a40c0caa5bc', '2026-03-29', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":394100,"regularOfferings":88625,"specialOfferings":20000},"totalFinances":502725}'::jsonb, 'L''offrande spéciale de 20 000f est une action de grâce.
TOUT EST GRÂCE.', NULL, '4cC6mG7lJ06QgMSuaWP3', '2026-03-29T16:53:54.560Z', '2026-06-14T00:36:55.915Z'),
('9a996b28-9ae0-461d-a53b-5e1d31136c81', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'd221cdad-7bfa-450f-918c-a9aa5a829e4c', '2025-10-26', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":1139305,"regularOfferings":244800,"specialOfferings":845000},"totalFinances":2229105}'::jsonb, NULL, NULL, '69RgBhqZt3HMCoBXERkj', '2025-10-29T08:55:04.280Z', '2026-06-14T00:36:56.073Z'),
('bbd0bde4-cfec-4263-8f8f-c94bc2b374fe', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '54896d20-094d-4a65-bf37-cd56cdfe7b98', '2026-04-12', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":90000,"regularOfferings":105450,"specialOfferings":0},"totalFinances":195450}'::jsonb, NULL, NULL, '6D3K20IAQ4Ax0mox2f1U', '2026-04-12T13:18:01.309Z', '2026-06-14T00:36:56.228Z'),
('3ab25eeb-bb1a-4dc3-bb34-bda679717430', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'af7fc398-3a8c-49ab-a784-919cd064e61c', '2025-12-03', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":251000,"regularOfferings":49400,"specialOfferings":0},"totalFinances":300400}'::jsonb, NULL, NULL, '7qJWAw2vxzcXhVzN9J9K', '2026-02-17T13:16:02.963Z', '2026-06-14T00:36:56.371Z'),
('b60eb966-6f11-4b13-86df-dfad3d203b19', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'f4f0a7a6-3e57-4af7-b938-0d051d6de75e', '2026-06-16', '645cea6d-2969-47c8-9e61-c0ec50f3518e', 'JEUNE ET PRIERE ', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":0,"regularOfferings":15000,"specialOfferings":52000},"totalFinances":67000}'::jsonb, 'L''offrande spéciale de 52000 est une semence pour l''AGC.

La gloire à notre Seigneur Jésus.', NULL, '81yZv5Y30ZkFWyZZN1XD', '2026-06-17T18:25:18.277Z', '2026-06-17T18:25:18.277Z'),
('5e0ba71c-5a93-48fd-945b-5b4003ab5344', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'f427d8bf-74d9-413d-878a-17669e693141', '2026-01-28', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":210500,"regularOfferings":30850,"specialOfferings":0},"totalFinances":241350}'::jsonb, NULL, NULL, '8RNU0QGfd7cZQpX1PqYJ', '2026-05-04T14:03:34.772Z', '2026-06-14T00:36:56.509Z'),
('7d3c54cc-9cbf-4c15-aefb-9cb15e2ae5b3', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '7e1023bd-0964-41a3-8f28-869588fe227c', '2026-06-14', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":435000,"regularOfferings":70200,"specialOfferings":0},"totalFinances":505200}'::jsonb, 'Pas d''offrande spéciale mais une offrande de 20 dollars qui a été ajouté au total sans conversion.
Point des 1er et 2ème culte
Dimes: 244000 + 435000 = 679 000 fcfa
Offrandes: 154950 + 70200 + 5000 = 230150 + 20 dollars
Total=  909 150 fcfa + 20 dollars', NULL, '8TwslM5J13HzA0myaAza', '2026-06-14T15:15:08.622Z', '2026-06-14T15:15:08.622Z'),
('8448feed-1409-41f2-ab58-102e40c2e67c', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '8cbf331e-f9bc-4c66-b908-a5c5fcf24239', '2026-03-01', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":600000,"regularOfferings":119600,"specialOfferings":20000},"totalFinances":739600}'::jsonb, 'Les offrandes speciales de 20.000 fcfa sont reparties comme suit:
- Semence Pasteur Mohammed SANOGO = 10.000
- offrande CJS= 10.000
Que le Nom du Seigneur soit beni.', NULL, '9qx03jTgETCZBCzvII8z', '2026-03-01T13:33:32.189Z', '2026-06-14T00:36:56.677Z'),
('0f152c48-3b20-490c-b323-1ee96d40a305', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '0c1a3390-8ba2-46aa-b079-e1687299282d', '2026-07-19', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":25375,"specialOfferings":50000,"regularOfferings":41000},"totalFinances":116375}'::jsonb, 'L''offrande spéciale de 50.000fcfa est destinée à la campagne IN SENEGAL.
QUE TOUTE LA GLOIRE REVIENNE A NOTRE SEIGNEUR JESUS.', NULL, 'AS6XSiaoZwfwfqNMISFM', '2026-07-19T13:58:24.349Z', '2026-07-19T13:58:24.349Z'),
('03fc2535-8472-4fa0-8d52-beb345e3b16e', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '626193ad-009e-4116-a480-67cc5e34894b', '2025-11-30', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":812200,"regularOfferings":189150,"specialOfferings":15000},"totalFinances":1016350}'::jsonb, 'OFFRANDE CJS : 60000
', NULL, 'BDt6siJvZ7V1uXCMB6fs', '2025-12-02T10:20:32.892Z', '2026-06-14T00:36:56.823Z'),
('53bde9a8-2f46-46fa-ad14-229e5ba4227b', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '98f70ece-b1aa-4638-b783-6ad10349d143', '2026-04-05', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":768000,"regularOfferings":261900,"specialOfferings":0},"totalFinances":1029900}'::jsonb, 'Tout est grâce. Que la Gloire revienne à notre Seigneur JESUS CHRIST', NULL, 'C6bmXrZGwDjvYdPleByp', '2026-04-05T12:58:24.937Z', '2026-06-14T00:36:57.002Z'),
('68f4f140-3235-44de-b3c0-d8d85def0217', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'a39a724e-8526-4b7b-a05c-3aeefdb5938c', '2026-05-10', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":407550,"regularOfferings":93400,"specialOfferings":100000},"totalFinances":600950}'::jsonb, 'Les offrandes spéciales de 100 000fcfa sont reparties comme suit:
            Semence mariage: 80 000f
                                Tour 931: 20 000f
Point des 2 cultes
Total dimes 1er et 2eme culte:  407 550 + 943 000 = 1.350.550f
Total offrandes 1er et 2eme culte: 94 100+ 193400 = 287500f
Total général 1er et 2eme culte= 1.638.050fcfa
Rendons gloire à DIEU', NULL, 'CFzcEPicW9WlpkZKx5Jj', '2026-05-10T14:33:23.701Z', '2026-06-14T00:36:57.148Z'),
('948d26c6-8ed7-4311-9593-e5a2994e89b1', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-07-09', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"specialOfferings":0,"tithes":43000,"regularOfferings":31000},"totalFinances":74000}'::jsonb, NULL, NULL, 'CIJXw6hw6ae9mQjIpTnw', '2025-07-12T10:34:27.476Z', '2026-06-14T00:36:57.306Z'),
('d40e8b9e-dbc5-4782-a403-e26dcb9a3c85', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '8b282ec3-690a-44cb-9dc2-1474b9c17a7c', '2025-02-09', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"totalFinances":127450,"finances":{"regularOfferings":107450,"tithes":20000,"specialOfferings":0}}'::jsonb, 'Absence de nombreux serviteurs à la  prière des serviteurs : la prière des serviteurs n’est pas facultative 
•⁠  ⁠Débordement global de 10 mn 
•⁠  ⁠Coupure d’électricité répétitives (GE / protection des appareils )
•⁠  ⁠Débordement du message par le Pasteur  :20 m
•⁠  ⁠Lenteur à la projection des versets 
•⁠  ⁠Les chantres sont restés debout longtemps pendant le message 
•⁠  ⁠Préparer le retour de la sainte cène pour le ramassage après le service 
Un chargeur de pile à pris un coup. 
', NULL, 'CNsAdzJmkHoCXHbEoTS2', '2025-02-10T15:27:46.315Z', '2026-06-14T00:36:57.446Z'),
('4f878d86-eb28-4938-87c1-c28c96d85b86', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '27795b0d-19b4-4f83-839d-2e246031062b', '2026-01-07', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":40000,"regularOfferings":75695,"specialOfferings":0},"totalFinances":115695}'::jsonb, NULL, NULL, 'CqnD4FfKDsOTmROU8zoq', '2026-05-04T13:46:04.993Z', '2026-06-14T00:36:57.606Z'),
('fbab01ae-d64b-4e29-8e03-da82478023db', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'd7524999-13ce-4426-a689-f6bff441c3f1', '2026-07-09', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":50000,"regularOfferings":29500,"specialOfferings":40000},"totalFinances":119500}'::jsonb, 'Les offrandes spéciales de        40 000 fcfa sont destinées à la campagne IN SENEGAL.
Merci Seigneur.', NULL, 'DGHRZ5RfB9Oj4bNjcpgm', '2026-07-09T15:08:19.921Z', '2026-07-09T15:08:19.921Z'),
('a07b4e96-d364-4621-a56d-a8ad90ba110e', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '8d7cd2cc-7af1-4772-99ea-eca14ca399fc', '2026-05-03', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":344600,"regularOfferings":157900,"specialOfferings":80500},"totalFinances":583000}'::jsonb, 'Les offrandes spéciales sont destinées au Tour 931.
Que toute la gloire revienne à notre Seigneur Jésus Christ.', NULL, 'DXIneRU0zSIoEsbFofLA', '2026-05-03T13:56:31.464Z', '2026-06-14T00:36:57.763Z'),
('9a864090-bb68-476e-a525-b9f8fff1d3ec', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '1c29a399-6b67-41ed-906b-81f88a983113', '2026-04-15', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":67000,"regularOfferings":49900,"specialOfferings":50000},"totalFinances":166900}'::jsonb, 'L''offrande spéciale de 50 000 fcfa est destinée au Tour 931.

Toute la gloire te revient Seigneur Jésus', NULL, 'DXOP5HiOgq3ubrbEZ9pz', '2026-04-18T09:39:15.382Z', '2026-06-14T00:36:57.928Z'),
('85621c8d-a273-4e36-8230-c519bbcbd8be', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '67184362-581b-4dd1-8569-a2619ad00c7a', '2026-05-17', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":1500,"regularOfferings":83900,"specialOfferings":77000},"totalFinances":162400}'::jsonb, 'Les offrandes spéciales de 77 000 fcfa sont des semences.
Point des 2 cultes
1er et 2e cultes 
Dimes= 147 000 + 1500 = 148 500
Offrandes= 92 300 + 160900= 253 200
Total 1er + 2e cultes : dimes + offrandes: 148500+253200= 401 700 fcfa
Merci Seigneur.', NULL, 'Dj7ks4RDpKj0WrqFGH7F', '2026-05-17T18:37:31.262Z', '2026-06-14T00:36:58.087Z'),
('7c71990f-a80b-44d2-8e44-cc051eb00244', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'af91fbc8-65ce-456e-97f5-77b8229e3b69', '2026-06-10', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":21000,"regularOfferings":44000,"specialOfferings":0},"totalFinances":65000}'::jsonb, 'Pas d''offrandes spéciales.
Seigneur merci  pour ta grâce.', NULL, 'FFLiXUEeJXBJKYGfKBha', '2026-06-11T05:47:33.325Z', '2026-06-14T00:36:58.231Z'),
('e591ac92-d2d6-4951-9b66-812d2cd569c9', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '04834f9c-2e77-4b27-b4f1-0749312e4b1a', '2026-05-17', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":147000,"regularOfferings":92300,"specialOfferings":0},"totalFinances":239300}'::jsonb, 'Que toute la gloire te revienne Seigneur.', NULL, 'Fus9tfT2avRIkFncF2YK', '2026-05-17T18:16:46.598Z', '2026-06-14T00:36:58.374Z'),
('33ea3d9d-2671-4973-b990-00fdf655e703', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'bccc1f6c-3e5e-4766-945d-dd265da21208', '2026-06-24', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":355000,"regularOfferings":29900,"specialOfferings":0},"totalFinances":384900}'::jsonb, 'Toute la gloire à notre Seigneur JESUS.', NULL, 'G1Br50F408kMsm0MjN4w', '2026-06-25T23:31:02.975Z', '2026-06-25T23:31:02.975Z'),
('0878221c-ca2a-438e-b42e-bc15b0f62be0', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '91042592-b062-43ad-8ef1-26b1d3d8ec1e', '2025-11-09', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":126200,"regularOfferings":120100,"specialOfferings":1120000},"totalFinances":1366300}'::jsonb, 'OFFRANDES CJS : 1120000 ', NULL, 'GIpr7WbipM5vSoak26Ia', '2025-11-13T16:08:53.085Z', '2026-06-14T00:36:58.518Z'),
('3714256d-b12e-4b9a-8948-cf497948ad58', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '41a04f05-e3bc-4f81-ae70-dc11219a2199', '2026-01-25', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":364000,"regularOfferings":182250,"specialOfferings":26500},"totalFinances":572750}'::jsonb, 'Offrandes PMS: 26500', NULL, 'GWXQF7OoT7zd7EQZn0Rw', '2026-05-04T14:02:43.883Z', '2026-06-14T00:36:58.691Z'),
('14803466-99e3-4803-ac8a-3c44d9025b54', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-04-06', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":560330,"specialOfferings":45500,"regularOfferings":116700},"totalFinances":722530}'::jsonb, '•⁠  ⁠Débordement 17 mn du message 
•⁠  ⁠Problème de son avec le micro cravate  du Pasteur au début du message : test des 2 micros à faire avant le début du culte 
•⁠  ⁠Sol des toilettes hommes pas propre : prévoir un contrôle pendant le culte Respo Valentin en charge 
•⁠  ⁠Organisation des annonces : communiquer tous les éléments devant passer au culte à la gestion pour prise en compte 
•⁠  ⁠Porte donnant sur la chaire à réparer : Suivi en semaine par le Pasteur 
•⁠  ⁠Acheter des colliers pour sceller les paniers d’offrandes : Mme TUEHI / voir avec Respo Valentin 

•⁠  ⁠Débordement 17 mn du message 
•⁠  ⁠Problème de son avec le micro cravate  du Pasteur au début du message : test des 2 micros à faire avant le début du culte 
•⁠  ⁠Sol des toilettes hommes pas propre : prévoir un contrôle pendant le culte Respo Valentin en charge 
•⁠  ⁠Organisation des annonces : communiquer tous les éléments devant passer au culte à la gestion pour prise en compte 
•⁠  ⁠Porte donnant sur la chaire à réparer : Suivi en semaine par le Pasteur 
•⁠  ⁠Acheter des colliers pour sceller les paniers d’offrandes : Mme TUEHI / voir avec Respo Valentin 
', NULL, 'Gx1dbETJnDiYcJOfpyvr', '2025-04-06T23:53:52.320Z', '2026-06-14T00:36:58.833Z'),
('0e65da98-8b0f-46b4-af1d-9db8db6ca27e', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '403d5c99-09af-4cd5-ae1d-92395bfd1422', '2026-02-15', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":372000,"regularOfferings":130385,"specialOfferings":0},"totalFinances":502385}'::jsonb, NULL, NULL, 'Hc1jsL7I6YNr8JTaKWMN', '2026-02-17T11:34:28.604Z', '2026-06-14T00:36:58.998Z'),
('ef76ee26-e825-459f-b66e-d01ce2fa1c03', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '8e21df60-5bed-4470-87c3-a01f5c15bc97', '2026-01-11', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":392000,"regularOfferings":115375,"specialOfferings":310000},"totalFinances":817375}'::jsonb, 'semence: 50000
Action de Grace : 140000
Prémices: 120000', NULL, 'HhPiGs0TY7KqeuGgJVdz', '2026-05-04T13:53:14.982Z', '2026-06-14T00:36:59.139Z'),
('62d3394d-4f1c-4b4c-87b6-88ff9d0ed124', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-03-30', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":460600,"specialOfferings":5940,"regularOfferings":122700},"totalFinances":589240}'::jsonb, 'Débordement 12 mn 
•⁠  ⁠Gestion des cultes absente au lancement du culte 
•⁠  ⁠Problèmes de son : on n’entend pas bien le Pasteur avec le micro cravate  pendant les chants 
•⁠  ⁠Bip de l’afficheur à mettre off 
•⁠  ⁠Problèmes de sons avec les vidéos 
•⁠  ⁠Avoir une équipe dehors pour « anakagzo » entre le lancement du culte et le début de la prédication 

À planifier 
 
•⁠  ⁠Une veillée des serviteurs à préparer : 25 Avril 
•⁠  ⁠Les rdv des champions débuteront en avril : organiser une réunion d’organisation le Dimanche 06/04 après le culte / Chaque département doit se préparer / Le Pasteur confirmera la date de début 
', NULL, 'HpzDmwpuRqw7yJk9hnoI', '2025-03-31T17:41:36.558Z', '2026-06-14T00:36:59.274Z'),
('28c248a7-8495-4d18-938b-8ca73d7232c5', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'e84f5357-d160-4b32-888e-b265ea020a87', '2026-06-14', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":244000,"regularOfferings":154950,"specialOfferings":5000},"totalFinances":403950}'::jsonb, 'L''offrande spéciale est de 5000 fcfa  est destiné au Tour 931.', NULL, 'JhhJHQru3FAKAdWpLWbQ', '2026-06-14T14:19:27.838Z', '2026-06-14T14:19:27.838Z'),
('d6bb3b6b-d1ee-45ad-8187-9161f4f950b1', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '1b20974a-56d6-4d6f-a470-b43004d5104d', '2026-01-18', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"totalFinances":516250,"finances":{"tithes":276500,"regularOfferings":150750,"specialOfferings":89000}}'::jsonb, NULL, NULL, 'KcZU9dkd8Ic92voEz0uq', '2026-05-04T13:57:06.868Z', '2026-06-14T00:36:59.414Z'),
('0ed00da5-08cc-4722-acb6-10b032d6495d', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'a0c7937a-4c6d-4fd3-b2ce-c3b28daa3266', '2026-06-21', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":451180,"regularOfferings":0,"specialOfferings":108100},"totalFinances":559280}'::jsonb, 'Pas d''offrande spéciale.
Point des 1er et 2eme culte
Dimes: 451180 + 41550 
= 492 730
Offrandes: 108100 + 73900
                   = 182 000
Total 1er et 2eme culte
559 280+ 115450= 674 730
Que le nom du Seigneur JESUS soit béni.', NULL, 'KkRd5kgO7xoEGxIvpYCN', '2026-06-21T14:58:27.340Z', '2026-06-21T14:58:27.340Z'),
('8fcedc88-3f6f-4ed4-ba2e-e72f227a99b6', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'b6147bbb-9f8a-4d72-9252-88ba82e398dd', '2026-07-05', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":293000,"regularOfferings":44800,"specialOfferings":258700},"totalFinances":596500}'::jsonb, 'Les offrandes spéciales de   258700f sont destinées à la campagne IN SENEGAL.
Toute la Gloire à notre Seigneur JESUS CHRIST.', NULL, 'L9E27YxatIOX7oXRpsUG', '2026-07-05T14:22:33.434Z', '2026-07-05T14:22:33.434Z'),
('544ad397-64a1-4c25-8b79-9c732f8ac3da', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'f7c81d0b-aef8-4ba7-8b51-d59b1ea5d1ef', '2026-07-12', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":253000,"regularOfferings":62600,"specialOfferings":32000},"totalFinances":347600}'::jsonb, 'Les offrandes speciales de 32000fcfa sont destinées à la campagne IN SENEGAL.
Nous rendons toute la gloire à notre Seigneur JESUS.
', NULL, 'LEI4we5ZOWDLpXbty78n', '2026-07-12T14:31:56.959Z', '2026-07-12T14:31:56.959Z'),
('a78dd58f-633f-4cd4-87b3-c9ca36f02aeb', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '7fa9e005-6a0e-4ab9-a2b1-c05f89b86258', '2026-05-24', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":67000,"regularOfferings":116350,"specialOfferings":147000},"totalFinances":330350}'::jsonb, 'Les offrandes spéciales de 147 000f sont des semences C''pentecôte.
Point des 1er et 2eme cultes
Dîmes: 47 650+ 67 000= 114 650f
Offrandes: 127 600 + 116 350= 243 950f
0ffrandes spéciales: 997 000 + 147 000= 1 144 000f
Total des deux cultes
114 650 + 243 950+ 1 144 000= 1 502.600 fcfa
MERCI SAINT-ESPRIT', NULL, 'M0z5tnobN96wX4nPVUfR', '2026-05-24T20:05:47.786Z', '2026-06-14T00:36:59.570Z'),
('b24b9fec-bec2-47d4-9b4c-9b0eb0923f80', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '4fe5ceaa-fbf1-4850-ad1d-c6bb5b7747ed', '2026-06-17', '645cea6d-2969-47c8-9e61-c0ec50f3518e', 'JEUNE ET PRIERE ', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":40000,"regularOfferings":0,"specialOfferings":33000},"totalFinances":73000}'::jsonb, 'Pas d''offrandes spéciales.
Que toute la gloire soit rendue à DIEU', NULL, 'MWFKtSfnlPCQtPD8Hdys', '2026-06-18T07:19:40.030Z', '2026-06-18T07:19:40.030Z'),
('eecbcbff-a65d-4668-816a-d458402c711d', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '734ec6db-2ed1-4505-adad-9797dbd97b8a', '2026-05-12', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":0,"regularOfferings":41000,"specialOfferings":2000},"totalFinances":43000}'::jsonb, 'L''offrande spéciale de 2000 f est une semence pour le mariage.', NULL, 'NCgq4v6LT7WqleDSnDKa', '2026-05-14T14:53:23.753Z', '2026-06-14T00:36:59.743Z'),
('0385fb35-c6b6-45a0-9320-5fdba90f956f', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '1518ce1a-d65e-49df-80a9-4efbfc9c4fee', '2026-04-26', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":26500,"regularOfferings":122100,"specialOfferings":479000},"totalFinances":627600}'::jsonb, 'Les offrandes spéciales d''un montant de 479 000 fcfa sont destinées au Tour 931.

Que le Nom du Seigneur soit béni.', NULL, 'NDZG2FjCVoehawVM2VXo', '2026-04-26T15:40:15.537Z', '2026-06-14T00:36:59.886Z'),
('81dbe884-143d-489f-842d-f26e4acc93a7', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'c5f8d3c5-b9b8-42fd-8d22-171f3178e2cb', '2026-06-21', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":41550,"regularOfferings":73900,"specialOfferings":0},"totalFinances":115450}'::jsonb, 'Pas d''offrande spéciale.

Que toute la gloire revienne à Dieu pour toutes les offrandes.




', NULL, 'NT1MefyXuSO1Nzb2p7pq', '2026-06-21T14:42:41.973Z', '2026-06-21T14:42:41.973Z'),
('ad498e3a-21fb-4040-81b0-5435275ad90a', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-08-03', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"regularOfferings":147850,"specialOfferings":0,"tithes":240000},"totalFinances":387850}'::jsonb, '•⁠  ⁠Gestion des cultes en retard 
•⁠  ⁠Débordement global de 31 mn
•⁠  ⁠Mauvaise coordination de certains chants 
•⁠  ⁠Son fort dans la salle 
•⁠  ⁠Positionnement des portiers : les gens entraient dans le dos des portiers 

Points de suivi 
•⁠  ⁠L’électricien doit également vérifier les leds côté batterie ( À faire mardi )
•⁠  ⁠Écouteurs à mettre à disposition pour le pianiste (À faire cette semaine) 
•⁠  ⁠Entretien cette semaine à faire pour éradiquer les moustiques (À faire cette semaine) 
', NULL, 'NgGe0LaFTueIIGXhTqyS', '2025-08-05T15:01:34.151Z', '2026-06-14T00:37:00.023Z'),
('7355dd68-b99a-4799-9f1c-64737fb7e241', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-06-01', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"regularOfferings":112900,"specialOfferings":0,"tithes":679700},"totalFinances":792600}'::jsonb, ' ⁠- Débordement du message de 25mn  
-Coupure d’électricité avant le culte.
. Problème au moment de l’annonce de C Pentecote : prévoir les détails des informations pour le pasteur 
TOUR 931 : 245000', NULL, 'Op8fKEk4ZioLqFSAkwyH', '2025-06-02T17:25:23.882Z', '2026-06-14T00:37:00.164Z'),
('3057f4f7-3d7d-4ebf-b740-33a514c56846', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'd08709ed-5bc8-49e7-ac85-700d42926ecc', '2026-03-12', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":90000,"regularOfferings":22700,"specialOfferings":0},"totalFinances":112700}'::jsonb, 'Rendons gloire à DIEU', NULL, 'QtdTmYuhwbVsb6eSsbva', '2026-03-12T22:05:38.713Z', '2026-06-14T00:37:00.308Z'),
('4cec6696-bbb5-4301-b2cb-8eb913c23b48', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-05-11', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"regularOfferings":73550,"specialOfferings":20000,"tithes":522200},"totalFinances":615750}'::jsonb, '•⁠  ⁠Débordement du message de 22 mn
•⁠  ⁠Débordement global de 13 mn 
-  Problèmes de sons avec le micro baladeur du Pasteur
•⁠  ⁠Interruption de l’électricité 
•⁠  ⁠Passer une vidéo pendant l’attente entre la prière des serviteurs et le lancement du culte pour le peuple déjà présent 
•⁠  ⁠Les classes  d’affermissement vont débuter le 25 Mai 2025 : Besoins à énoncer', NULL, 'QyedTMkB8JppWtGGbMgy', '2025-05-12T09:50:37.829Z', '2026-06-14T00:37:00.471Z'),
('4741c4e5-3a1f-4415-91ad-dde73e26abec', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'b77bf93d-d913-488d-b5f9-6616811be045', '2026-04-08', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":120300,"regularOfferings":39100,"specialOfferings":0},"totalFinances":159400}'::jsonb, 'Gloire à Dieu', NULL, 'R2tYESm28fLN41qdGs7M', '2026-04-08T22:10:47.811Z', '2026-06-14T00:37:00.614Z'),
('ef8df542-c13c-4076-b980-ac15e6b85570', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '1d2891de-e0ca-487d-a152-be003fba5733', '2026-03-08', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":185000,"regularOfferings":127145,"specialOfferings":500},"totalFinances":312645}'::jsonb, 'L''offrande speciale de 500 FCFA est une semence au Pasteur Mohammed SANOGO.

GLOIRE A DIEU.', NULL, 'Rbyk1dsXF1K0RZUtOn94', '2026-03-08T13:03:15.840Z', '2026-06-14T00:37:00.757Z'),
('c0dc6ea7-7073-46eb-9823-f7167bbf9ec5', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-05-28', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"regularOfferings":32100,"specialOfferings":0,"tithes":3500},"totalFinances":35600}'::jsonb, NULL, NULL, 'SMiY5YVP2jXJueVfZ7HZ', '2025-05-30T07:35:32.961Z', '2026-06-14T00:37:00.901Z'),
('8aefd983-f1cc-499e-a63c-33539f86628a', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-05-18', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"specialOfferings":0,"regularOfferings":134550,"tithes":22500},"totalFinances":157050}'::jsonb, NULL, NULL, 'SbbyYcLlSyFiEKjzTggx', '2025-05-18T19:12:22.465Z', '2026-06-14T00:37:01.038Z'),
('ce747ae9-0e97-425e-9f4b-0607716c316d', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '4b2bf473-307b-48d0-b69c-0cbbe92057d9', '2026-06-15', '645cea6d-2969-47c8-9e61-c0ec50f3518e', 'JEUNE ET PRIERE ', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":1500,"regularOfferings":23000,"specialOfferings":0},"totalFinances":24500}'::jsonb, 'Pas d''offrandes speciales.
 Tout est grâce.
', NULL, 'Sbo3G9fBHYYRDyPQISRB', '2026-06-17T18:23:06.100Z', '2026-06-17T18:23:06.100Z'),
('7566719c-1117-4421-946d-54160b31e770', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-07-20', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":109000,"specialOfferings":0,"regularOfferings":100850},"totalFinances":209850}'::jsonb, '⁠Quelques soucis techniques au niveau de la COM lors du lancement du culte


', NULL, 'SosD1FnwCewehknC341B', '2025-07-20T13:30:05.460Z', '2026-06-14T00:37:01.206Z'),
('bb351f7f-74f0-4846-ab96-5d09ee874879', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '846624ce-2e56-4592-83f0-5cd17384c8a1', '2026-04-15', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":0,"regularOfferings":22500,"specialOfferings":0},"totalFinances":22500}'::jsonb, NULL, NULL, 'Thx9YMrJG1X0gn0fV4gN', '2026-04-15T18:32:10.317Z', '2026-06-14T00:37:01.364Z'),
('64fe0cb3-bcac-42ea-803b-b3fea66008c9', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '78cca6b8-b51f-44cf-8ad7-4c033035c574', '2026-07-21', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', NULL, 'Inconnu (ancien système)', '{"totalFinances":258000,"finances":{"tithes":215000,"specialOfferings":0,"regularOfferings":43000}}'::jsonb, 'Il n''y a pas eu d''offrandes spéciales.
Toute la gloire revient à notre Seigneur JESUS CHRIST.', NULL, 'ULlNZR8C0K5AEY3OHA7U', '2026-07-22T20:56:26.153Z', '2026-07-22T20:56:26.153Z'),
('3b61701e-831a-4c97-91a5-d000abc4f28c', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'cc4a585c-0aa3-4c9b-82cb-0c79a60f35d2', '2026-07-12', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":240000,"regularOfferings":71050,"specialOfferings":170000},"totalFinances":481050}'::jsonb, 'Les offrandes spéciales de 170000 fcfa sont destinées à la campagne IN SENEGAL.
POINT 1ER ET 2EME CULTE
Dimes: 253000 + 240000
            = 493 000 fcfa
Offrandes: 62600 + 71050
             =  133 650 fcfa
Offrandes spéciales
32000 + 170000= 202000 fcfa
Total 1er et 2ème
493000 + 133650+ 202000
= 828 650 fcfa.
Que toute la gloire te revienne PÉRE.

', NULL, 'UklJ1rNdSIgZhCchmdCA', '2026-07-12T14:44:04.664Z', '2026-07-12T14:44:04.664Z'),
('57c43e92-4e8f-470c-b424-fdd8d35ea725', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '6b9f9d81-33d3-4d5c-a84c-81e45fbf8d16', '2025-01-26', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"totalFinances":1205050,"finances":{"tithes":994900,"specialOfferings":25000,"regularOfferings":185150}}'::jsonb, '- Le son du piano était fort pendant le temps de direction
- Débordement de 02 mn du dirigeant 
- Son du piano fort pendant la prédication 
- Débordement de 30mn du temps de message 
- Prévoir la salle Annexe pour ECODIM 

', NULL, 'V1y6dxMN6nQrsK7K8n7q', '2025-01-26T13:08:11.217Z', '2026-06-14T00:37:01.528Z'),
('c55070b0-9549-4395-aadf-94b41d13585f', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '15c19031-b429-450d-9d31-dda697eb602d', '2025-09-26', '9bf2d72a-c692-40ed-8c9b-8ff60986fb95', 'Matinale de Prières', NULL, 'Inconnu (ancien système)', '{"finances":{"specialOfferings":0,"tithes":0,"regularOfferings":4500},"totalFinances":4500}'::jsonb, NULL, NULL, 'VcRqfsw2TsKXU8VBobLQ', '2025-09-26T12:00:29.713Z', '2026-06-14T00:37:01.671Z'),
('caff97ce-d44a-41df-bf03-000c53e44627', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-05-14', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"specialOfferings":0,"tithes":81100,"regularOfferings":27100},"totalFinances":108200}'::jsonb, '•⁠  ⁠Retard des chantres === Le pasteur a été obligé de faire l’adoration
•⁠  ⁠Débordement du message de 13mn 
•⁠  ⁠Problème de son lors des goods news avec la Com
•⁠  ⁠⁠Cris des enfants pendant le culte 
•⁠  ⁠⁠Lenteur d’affichage des versets 
•⁠  ⁠⁠Problème avec la sono pour le micro portatif 
•⁠  ⁠⁠Problème de son au moment des good news ( les good news n’ont pas été passées)
', NULL, 'WJLGcI8qZouD0q9EHtv3', '2025-05-15T15:32:05.003Z', '2026-06-14T00:37:01.838Z'),
('d303cd0b-85f1-4610-8ec2-db5492ca4d1f', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '8e6adddd-c0ed-45de-b049-ace425b54057', '2026-05-27', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":40000,"regularOfferings":137300,"specialOfferings":144100},"totalFinances":321400}'::jsonb, 'C''pentecote = 144100 
', NULL, 'WzqSElvfQxrlHNt7jKFS', '2026-05-28T12:49:46.644Z', '2026-06-14T00:37:01.981Z'),
('8a797917-f428-4cb6-addb-6638a6872fa1', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-05-25', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"regularOfferings":125350,"specialOfferings":0,"tithes":268500},"totalFinances":393850}'::jsonb, '•⁠  ⁠Débordement global de 10 mn 
•⁠  ⁠Manque de coordination au niveau des chantres au début du culte : veiller à arriver tôt pour répéter avant le culte 
•⁠  ⁠Problèmes de sons avec le micro du Pasteur : Tests à faire 
•⁠  ⁠Annonces non adaptées à la cellule : veiller à retirer les annonces qui ne correspondent pas à nos programmes 
•⁠  ⁠Faire entrer les paillassons lorsque nous fermons les portes 
•⁠  ⁠Proposition de date de formation des dirigeants 
', NULL, 'XCbzrrHexpjUVEgMYtzM', '2025-05-26T12:31:11.904Z', '2026-06-14T00:37:02.141Z'),
('dd0cf80a-845e-4007-9eb0-a594d617ecef', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '24df545d-a221-431b-a25f-22e074da8a15', '2026-04-29', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":498500,"regularOfferings":46100,"specialOfferings":55000},"totalFinances":599600}'::jsonb, 'Les offrandes speciales de 55000 fcfa sont destinées au Tour 931.

Que toute la gloire revienne à notre Seigneur Jésus Christ.', NULL, 'XkyhW1Wh8QULYrvmrPjt', '2026-04-30T18:14:24.148Z', '2026-06-14T00:37:02.303Z'),
('72647074-01b8-480e-9351-c9e2a9180180', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-09-17', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":83200,"regularOfferings":33600,"specialOfferings":0},"totalFinances":116800}'::jsonb, NULL, NULL, 'XzAr5ll5HxNZZXxLjHJ1', '2025-09-18T18:06:25.780Z', '2026-06-14T00:37:02.461Z'),
('1fbd690f-eaf9-4318-9655-90e54f240e7b', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '2f004f21-7637-4d95-80b1-e12bb097d1a7', '2026-04-19', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":11000,"regularOfferings":177500,"specialOfferings":30000},"totalFinances":218500}'::jsonb, 'Les offrandes speciales de 30000fcfa sont destinés au Tour 931.

Gloire à Toi Seigneur.', NULL, 'YaopxSnRdXKVFRxq6ht0', '2026-04-19T14:48:23.226Z', '2026-06-14T00:37:02.605Z'),
('090b7d61-84b3-4c2c-8c4e-6509d962293c', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '9767f97a-fdf3-44bc-8011-17663235a609', '2025-11-16', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":393200,"regularOfferings":160545,"specialOfferings":815000},"totalFinances":1368745}'::jsonb, 'CJS SENEGAL 815000', NULL, 'YfUhTkRZpX6CwTBRQKwl', '2025-11-18T10:39:16.109Z', '2026-06-14T00:37:02.752Z'),
('3e7fd111-24b3-43ba-bbe5-2d02407288ce', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '6968898e-a9de-48f6-84c1-b9939442f7fb', '2026-02-22', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":59800,"regularOfferings":163200,"specialOfferings":10000},"totalFinances":233000}'::jsonb, 'L''offrande speciale de dix (10000) est relative à la campagne JESUS SAUVE. Elle sera reversee dans la caisse de Club de Vie.', NULL, 'YgL2DlcyOSHX596X5t3o', '2026-02-22T14:19:25.948Z', '2026-06-14T00:37:02.900Z'),
('3ce4d28b-7240-44fc-be53-f71889c056bb', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '10898762-c828-4d5d-b384-0755974a2703', '2026-01-14', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"totalFinances":131500,"finances":{"regularOfferings":46500,"tithes":80000,"specialOfferings":5000}}'::jsonb, 'Action de Grace = 5000', NULL, 'ZAcd7wW7P61kuhFYLJXn', '2026-05-04T13:54:50.084Z', '2026-06-14T00:37:03.036Z'),
('a284b0d3-aa93-4a2d-afd0-627c17411db8', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'cbac0d4c-3da9-4b39-97f7-2ece3a32115e', '2026-05-08', '068f255c-f24c-4e11-af66-607b8c42f229', 'Séminaire', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":30000,"regularOfferings":140400,"specialOfferings":0},"totalFinances":170400}'::jsonb, 'Pas d''offrande spéciale enregistrée.
Rendons grâce à DIEU.', NULL, 'ZDjmRYfWhXCYgMtoGzLD', '2026-05-10T07:44:19.971Z', '2026-06-14T00:37:03.176Z'),
('ee2214bf-d7bd-4440-bfc2-f4e9a31b4254', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-07-27', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"regularOfferings":108960,"tithes":514000,"specialOfferings":0},"totalFinances":622960}'::jsonb, '•⁠  ⁠Débordement global de 14 mn 
•⁠  ⁠Sifflements (son de la télé ) 
•⁠  ⁠Problème avec le son du dirigeant , son bas
•⁠  ⁠Écho sur le son du micro du Pasteur 
•⁠  ⁠La gestion des cultes a oublié d’afficher le temps 
•⁠  ⁠Images de la caméra sur les écrans sombre à certains moments 
•⁠  ⁠Positionnement des chantres sur la chaire : avancer la chaire pour faciliter la circulation de la lead 
•⁠  ⁠Positionnement des portiers : les gens entraient dans le dos des portiers 

Points de suivi ( Rappel) 
•⁠  ⁠L’électricien doit également vérifier les leds côté batterie ( À faire mardi )
•⁠  ⁠Écouteurs à mettre à disposition pour le pianiste (À faire cette semaine) 
•⁠  ⁠Entretien cette semaine à faire pour éradiquer les moustiques (À faire cette semaine) 
', NULL, 'ZcjY6sjcV8M5IGGcXpGP', '2025-08-05T14:51:22.736Z', '2026-06-14T00:37:03.311Z'),
('75b3a8d3-3d9d-489b-8a59-0adece8d865f', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '6ecc8b07-0189-40f6-9c94-cd0c000584a3', '2025-12-07', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":701500,"regularOfferings":121300,"specialOfferings":266000},"totalFinances":1088800}'::jsonb, NULL, NULL, 'ZtMhjQJtzGvPrQZGg8U0', '2026-02-17T13:19:52.101Z', '2026-06-14T00:37:03.477Z'),
('0e0fbdb7-8ad2-4170-9f16-3877bd95b527', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'ea719000-591c-4432-95f4-32e7feaeeeed', '2026-06-18', '645cea6d-2969-47c8-9e61-c0ec50f3518e', 'JEUNE ET PRIERE ', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":0,"regularOfferings":23500,"specialOfferings":50000},"totalFinances":73500}'::jsonb, 'Action de grâce 50000', NULL, 'ZwwTSnwWDlHb10xEXaVu', '2026-06-20T03:12:15.360Z', '2026-06-20T03:12:15.360Z'),
('47a872a0-b6cf-4437-a13e-f12472be2414', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '4c53f406-571e-4396-91b5-cc3c7d166998', '2025-03-02', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"totalFinances":886200,"finances":{"regularOfferings":70100,"tithes":816100,"specialOfferings":0}}'::jsonb, '•⁠  ⁠Erreur sur le timing au niveau de l’heure de montée du dirigeant : Gestion des cultes  
•⁠  ⁠10 mn de retard sur la prédication / Culte terminé avec 05 mn d’avance 
•⁠  ⁠Besoin d’un portier à l’entrée pour orienter les nouveaux qui sont en retard : Tata Blanche + Respo TUEHI + Pasteur 
•⁠  ⁠Difficultés avec les chants au début / instaurer une répétions avec les chantres à partir de 7h le dimanche : Pasteur 
•⁠  ⁠Une veillée des serviteurs à préparer : date à confirmer par le Pasteur 
•⁠  ⁠Les rdv des champions débuteront en avril : Chaque département doit se préparer / Le Pasteur confirmera la date de début 
', NULL, 'b31LHT432hYJv70jVgat', '2025-03-02T13:06:27.918Z', '2026-06-14T00:37:03.633Z'),
('1f31709a-876b-4afb-b041-6a4aff574f98', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '8013c916-2429-4542-9c76-3010ba5d02d6', '2025-09-28', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"totalFinances":1225650,"finances":{"tithes":1060600,"specialOfferings":20000,"regularOfferings":145050}}'::jsonb, '20.000 POUR LA SEMENCE DE LA RENTREE. ', NULL, 'be5FW2IliXLgRfa2cjU2', '2025-09-28T16:46:34.989Z', '2026-06-14T00:37:03.776Z'),
('1e27e9e6-6a16-443f-b964-f61421b28720', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-05-04', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"specialOfferings":0,"tithes":2344600,"regularOfferings":93350},"totalFinances":2437950}'::jsonb, '•⁠  ⁠Débordement du culte de 5 mn 
-  Problèmes récurrents avec les écrans de la Com  
•⁠  ⁠Organisation des portiers / prise en charge des nouveaux arrivants avec enfants : les portiers doivent demander l’âge de l’enfant et proposer de le déposer à l’ecodim avant de les faire entrer dans la salle 
•⁠  ⁠Le stagiaire affecté aux portiers n’a pas été correctement briefé 
•⁠  ⁠Interruption du courant  : Test à faire pour identifier ce qui fait sauter le compteur 
•⁠  ⁠Les classes  d’affermissement vont débuter le 18 Mai 2025 

À vérifier 

•⁠  ⁠Déco en charge du nettoyage des portes : produit à acheter 
•⁠  ⁠Mettre en place une trousse d’urgence pour les 1ers soins : tata Blanche 

À planifier 
 
•⁠  ⁠Les rdv des champions débuteront  le Mercredi 07 Mai / Chaque département doit se préparer
', NULL, 'c02SnCuhcAkZ35GIRY9Q', '2025-05-05T16:46:01.765Z', '2026-06-14T00:37:03.911Z'),
('41f1dbf7-5c31-4198-892c-a26a8b89eb55', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '2d199d3f-a1e7-4f41-9b21-63292ea9bc87', '2025-09-24', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":128200,"specialOfferings":0,"regularOfferings":14600},"totalFinances":142800}'::jsonb, NULL, NULL, 'c3f8GCuQ0Z5wVyQQkaU6', '2025-09-25T18:21:11.322Z', '2026-06-14T00:37:04.052Z'),
('b6393e68-8879-4d91-9a91-90d0cde98a7b', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-06-11', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"specialOfferings":0,"regularOfferings":36100,"tithes":0},"totalFinances":36100}'::jsonb, '•⁠  ⁠Retard de lancement du culte du à la com qui n’était pas prête - câble défaillant - vidéo de proclamation n’avait pas un bon son 
•⁠  ⁠Dirigeant était occupé à la sono au lieu de se préparer à monter ', NULL, 'cNzrZbeKtXFGx1msHSHl', '2025-06-16T18:01:02.508Z', '2026-06-14T00:37:04.216Z'),
('6cadcb82-e22a-49d5-85e6-9b1abb227710', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'b95d792c-baca-4f83-ad1e-c8a631117eb1', '2025-11-26', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":0,"regularOfferings":33800,"specialOfferings":0},"totalFinances":33800}'::jsonb, NULL, NULL, 'cS50DxOLo7FxBxIUIywO', '2025-12-02T10:14:41.905Z', '2026-06-14T00:37:04.354Z'),
('8be2cad6-7bd4-4a72-9dfa-f87db32a61c0', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-06-08', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"regularOfferings":112900,"specialOfferings":0,"tithes":1088650},"totalFinances":1201550}'::jsonb, NULL, NULL, 'cc4ZLW00CVqGMQP7cNLt', '2025-06-08T14:45:04.366Z', '2026-06-14T00:37:04.491Z'),
('98487190-3c35-417b-8782-57be84cf61b5', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'a5c4073e-f66a-49a5-8be8-b1c9c90cdb2b', '2025-01-05', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"totalFinances":311200,"finances":{"tithes":17100,"regularOfferings":132600,"specialOfferings":161500}}'::jsonb, '- Lenteur dans les affichages des versets au niveau de la Comm;
- Température élever dans la salle;
- Chant de l''accueil des nouveaux perturbé par la melodie du pianiste; 
- Débordement globale de 20 mn du Pasteur;
- les serviteurs doivent soutenir les intervenants, acclamations... 

', NULL, 'd0bkih8nCYTjjDhzwS8b', '2025-01-05T21:16:36.895Z', '2026-06-14T00:37:04.633Z'),
('c9e6ee24-1923-4588-8e49-a759b630c4c8', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-06-04', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"regularOfferings":38050,"specialOfferings":0,"tithes":349300},"totalFinances":387350}'::jsonb, '⁠  ⁠Retard de lancement du culte du à la com qui n’était pas prête 
•⁠  ⁠Le son était fort dans la salle sur la première partie du culte (avant montée du dirigeant ) 
•⁠  ⁠Débordement de 17 mn du message ', NULL, 'd2K3ZRW9hX3ry3nYXI4V', '2025-06-08T14:26:03.996Z', '2026-06-14T00:37:04.771Z'),
('d6d18616-3872-4568-b092-1fbe050acf56', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'a7b08c96-3aeb-44b1-85d7-df9c927fe119', '2026-05-17', '2121e6a8-1df7-4842-8447-6b918a69be81', 'CULTE DES BOSS', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":0,"regularOfferings":33500,"specialOfferings":0},"totalFinances":33500}'::jsonb, NULL, NULL, 'dAdhuCFKLycewOQQbv40', '2026-05-18T18:17:11.969Z', '2026-06-14T00:37:04.905Z'),
('9becefb9-e7b0-4d78-9478-b4c4843c0632', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '5f6c56da-0885-491a-af29-efa522164b27', '2026-06-19', '645cea6d-2969-47c8-9e61-c0ec50f3518e', 'JEUNE ET PRIERE ', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":7000,"regularOfferings":21500,"specialOfferings":0},"totalFinances":28500}'::jsonb, NULL, NULL, 'e3cfftFvjiBKcmBluJPJ', '2026-06-20T03:14:37.504Z', '2026-06-20T03:14:37.504Z'),
('c090ae77-e40b-4376-8438-f6a5b4b1718d', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'c5b37509-82f0-4a5b-8f74-4b0debc06a5e', '2026-06-23', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":0,"regularOfferings":33600,"specialOfferings":0},"totalFinances":33600}'::jsonb, 'Tout est grâce. Merci Seigneur.', NULL, 'eBeHNsDMiKAewtvCZ2hC', '2026-06-25T23:28:54.578Z', '2026-06-25T23:28:54.578Z'),
('0668b798-6f4a-42d6-85c1-bb4ee1a8f5c7', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '78ff7642-af53-44b5-8104-c5b68e7fa893', '2026-05-06', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":56600,"regularOfferings":53000,"specialOfferings":0},"totalFinances":109600}'::jsonb, 'Nous te rendons grâce Seigneur.', NULL, 'eGOl24p5Wfu5Ky03HOKb', '2026-05-07T09:06:25.457Z', '2026-06-14T00:37:05.045Z'),
('cea070a5-d97e-4cee-b1db-47fe6203bc5c', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-09-07', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":973500,"regularOfferings":136200,"specialOfferings":78000},"totalFinances":1187700}'::jsonb, '•⁠  ⁠Problème sur la qualité du son du direct
•⁠  ⁠Problème de son (micro du pasteur qui siffle ) 
-Mauvaise prise en main du micro par la dirigeante (cela a déformé son son ) 
-Mauvaise posture de la personne en charge de l’accueil des nouveaux 

Points de suivi 

•⁠  ⁠L’électricien doit également vérifier les leds côté batterie ( À faire )
•⁠  ⁠Entretien cette semaine à faire pour éradiquer les moustiques (À faire ) 
', NULL, 'eICMYkZqWlfqfK2koPen', '2025-09-07T14:35:10.804Z', '2026-06-14T00:37:05.186Z'),
('a3d90079-4a1b-4f7d-b72f-8599e4be59e3', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'f5f2c26a-036f-4748-a266-4d5ce4186c8a', '2026-03-22', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":572000,"regularOfferings":188500,"specialOfferings":0},"totalFinances":760500}'::jsonb, 'Que toute la gloire soit rendue à DIEU Notre PÉRE.', NULL, 'eSZ0gMV5q4mG0XqnjefD', '2026-03-22T13:13:11.007Z', '2026-06-14T00:37:05.330Z'),
('1fd24fb2-61cb-4155-a4f9-b7b0da5790ad', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-08-01', '6985bfef-b10d-4483-b032-7b3f8bde144f', 'Veillée de Prière', NULL, 'Inconnu (ancien système)', '{"finances":{"specialOfferings":0,"regularOfferings":111600,"tithes":88300},"totalFinances":199900}'::jsonb, NULL, NULL, 'eVPLqFYgdoh9Ar5tq3yL', '2025-08-05T14:58:49.815Z', '2026-06-14T00:37:05.470Z'),
('31e88193-f1de-4b6f-9af7-54588734f468', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '03c52141-7309-40e0-9900-9c637ecffb0e', '2026-06-28', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":63000,"regularOfferings":55150,"specialOfferings":0},"totalFinances":118150}'::jsonb, 'Pas eu d''offrande spéciale.
Point des 1er et 2éme culte
Dimes: 113600 + 63000 
               = 176 600
Offrandes: 60400 + 55150
                 = 115 550
Offrandes spéciale: 55 000
Total général 1er et 2è culte
   176600 + 115500 + 55000
  = 347 150 fcfa
Gloire à DIEU.
', NULL, 'ebmpahMwlYkPlx4nHN6J', '2026-06-28T14:30:19.350Z', '2026-06-28T14:30:19.350Z'),
('97d6abd8-b1cb-47b5-87a5-9294fb71670f', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '6ecc8b07-0189-40f6-9c94-cd0c000584a3', '2025-12-07', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":701500,"regularOfferings":121300,"specialOfferings":263000},"totalFinances":1085800}'::jsonb, 'CJS : 3000', NULL, 'fKZnj53Mu0BxrIUbBImu', '2025-12-10T13:02:31.979Z', '2026-06-14T00:37:05.618Z'),
('ec4db9a0-3eba-4d5f-9d85-af47f6a04811', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '8ab6559b-92c2-4f93-b5db-3a818cd9d43f', '2026-05-03', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":168100,"regularOfferings":227360,"specialOfferings":272000},"totalFinances":667460}'::jsonb, 'Les offrandes spéciales de 272000fcfa sont destinées au Tour 931.

Point du premier et du deuxième culte
Total dîme: 344600+ 168100= 512700f
Total offrandes: 157900 + 227360 = 385260f
Total offrandes speciales (T931) : 272000 + 80500= 352500f
Total 1er et 2eme culte: offrandes + dîmes= 1 250 460fcfa
Merci Seigneur pour tes grâces.', NULL, 'fPXJpDTNKSwfFEWzomqo', '2026-05-03T14:12:47.349Z', '2026-06-14T00:37:05.761Z'),
('34ec5910-5b65-433f-93cc-e3e9b444d4b5', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-08-31', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"specialOfferings":0,"regularOfferings":138900,"tithes":344600},"totalFinances":483500}'::jsonb, '•⁠  ⁠problème d’électricité dans les salles de l’ECODIM
•⁠  ⁠Problème sur la qualité du son du direct
', NULL, 'fgjJOiLaBHyB4DGhdFDY', '2025-09-04T17:52:04.786Z', '2026-06-14T00:37:05.904Z'),
('6d934115-6774-4f9c-9be4-adb4d5509cd2', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '35b9922d-e8ae-4924-92d9-8e5ff93d1ade', '2026-01-04', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":695700,"regularOfferings":343600,"specialOfferings":415000},"totalFinances":1454300}'::jsonb, 'Semence AGC= 290000
PREMICE= 120000
Act de GR= 5000', NULL, 'fgskqRmdt8mrzTV6J1Mo', '2026-05-04T13:51:00.401Z', '2026-06-14T00:37:06.050Z'),
('72c7176e-7350-41e9-9e7a-c699e87bd8b5', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'abe20397-11bb-43c8-83fa-74ed13906b28', '2026-04-28', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":0,"regularOfferings":53000,"specialOfferings":5000},"totalFinances":58000}'::jsonb, 'L''offrande speciale de 5000 fcfa est destinée au Tour 931.
Que le nom du Seigneur soit béni.', NULL, 'h0X6Q9Db3fwEZiD1QtNZ', '2026-04-30T18:09:23.449Z', '2026-06-14T00:37:06.204Z'),
('09f1d56b-de68-4401-b40d-85bbf8b0ffc5', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-08-10', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"regularOfferings":127550,"tithes":669970,"specialOfferings":0},"totalFinances":797520}'::jsonb, '•⁠  ⁠un problème au niveau de l’affichage du verset au niveau de la COM
•⁠  ⁠Problème de sons sur les retours;', NULL, 'hbqMugrdg7AHKehgiWwr', '2025-08-10T13:51:33.867Z', '2026-06-14T00:37:06.363Z'),
('bd78b8eb-2032-4a19-8007-667395f7717e', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '9c28739c-04cd-46e0-af1d-a9ea207b3ba8', '2026-07-19', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"totalFinances":387450,"finances":{"regularOfferings":130950,"specialOfferings":80000,"tithes":176500}}'::jsonb, 'Les offrandes spéciales de 80000 fcfa sont destinées à la campagne IN SENEGAL.
POINT DES 1er ET 2ème
Dimes: 
25375 + 176500 =  201 875 f
Offrandes:
 41000 + 130950  = 171 950 f
Offrandes speciales:
50000+80000= 130 000 f
Total : 1er et 2ème cultes
201875+ 171950+ 130000
= 503 825 fcfa.
MERCI SEIGNEUR POUR TA BONTE.', NULL, 'i8CrIOl9TbqqxBNsYcMI', '2026-07-20T20:15:23.307Z', '2026-07-20T20:15:23.307Z'),
('1dd337f8-91f5-4b1f-86d1-30888393fc0a', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '68a0e242-5ad9-4635-b2b0-9f6beab39bcb', '2025-03-09', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"totalFinances":225550,"finances":{"tithes":148500,"specialOfferings":0,"regularOfferings":77050}}'::jsonb, '•⁠  ⁠12 mn de débordement global 
•⁠  ⁠Problèmes avec le micro du lead
•⁠  ⁠Son du micro dirigeant bas au début de son intervention
•⁠  ⁠La com  et les autres départements doivent communiquer les éléments vidéo et autres à la com samedi midi pour prise en compte au timing 
•⁠  ⁠Télécommande Ecodim défaillant : Respo  Valentin 
•⁠  ⁠Senteurs des toilettes à poser sur un meuble pour éviter l’accès aux enfants : Respo Blanche 
•⁠  ⁠Réparer la table de réception des nouveaux : Respo Blanche 
•⁠  ⁠Plinthe à réparer dans la salle : Respo Blanche 
•⁠  ⁠⁠Nettoyage des chaises de la salle de culte : Sœur Koro 

À planifier 
•⁠  ⁠Veillée du digital du Centre Kodesh à la salle de la CDVH le Vendredi 14 Mars. Certains départements seront saisis 
•⁠  ⁠Une veillée des serviteurs à préparer : 04  Avril 
•⁠  ⁠Les rdv des champions débuteront en avril : Chaque département doit se préparer / Le Pasteur confirmera la date de début 
', NULL, 'iDQ4dshXh3J2T7ncmP5k', '2025-03-09T14:30:21.729Z', '2026-06-14T00:37:06.502Z'),
('74fb9183-a50d-4f6c-bfe7-42997b2f7c1a', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '6bf3ca89-d6d5-45d9-9f3e-de1d0d64b4af', '2025-11-23', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":142600,"regularOfferings":215200,"specialOfferings":18350},"totalFinances":376150}'::jsonb, 'OFFRANDES CJS SENEGAL : 5000 ', NULL, 'j4y49Glp7oLHEyGOCRnL', '2025-11-25T12:11:44.479Z', '2026-06-14T00:37:06.670Z'),
('b0361970-4b34-4c73-9c04-2148dd6011f2', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-04-20', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"regularOfferings":145250,"specialOfferings":0,"tithes":234150},"totalFinances":379400}'::jsonb, '•⁠  ⁠La première parade a été plus longue que le temps prévu au timing 
•⁠  ⁠Omissions de certaines annonces sur le timing 
•⁠  ⁠Disposition de la table en retard qui a impacté la distribution 
•⁠  ⁠Mauvaise prise en main des paniers par les portiers lors de la prière 
•⁠  ⁠Les serviteurs doivent être en poste le vendredi à partir de 18h. Mini veillée de 20h à minuit. 
•⁠  ⁠Split de la salle annexe à réparer 
•⁠  ⁠Améliorer le rangement du matériel par la com / les portiers ….

À planifier 
 
•⁠  ⁠Une veillée des serviteurs à préparer : 25 Avril / thème + créa à diffuser 
•⁠  ⁠Les rdv des champions débuteront  le Mercredi 07 Mai / Chaque département doit se préparer
', NULL, 'j85ZNurXng0XyKO4MEOT', '2025-04-21T09:49:47.804Z', '2026-06-14T00:37:06.806Z'),
('37c85d0c-37dd-4173-b959-2008277cba83', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-08-24', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"specialOfferings":0,"regularOfferings":90200,"tithes":20500},"totalFinances":110700}'::jsonb, ' - Problème d’affichage du verset avec la Com
•⁠  ⁠Problème technique au niveau du son pendant les GOOD News
', NULL, 'jiLOyVsZcP6lvNsQ7UMh', '2025-08-25T08:56:09.189Z', '2026-06-14T00:37:06.943Z'),
('03584991-3c3d-4f5f-9295-306120c7398a', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'ecabcabd-6ed3-4155-bac2-a33a668c579b', '2026-04-12', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":274000,"regularOfferings":85890,"specialOfferings":0},"totalFinances":359890}'::jsonb, NULL, NULL, 'kK9sv3HCpdYUHqtMYJM1', '2026-04-12T13:22:17.624Z', '2026-06-14T00:37:07.083Z'),
('e5e03250-72a3-4e21-b0b3-ed53290c193a', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-03-23', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":16000,"specialOfferings":30000,"regularOfferings":111000},"totalFinances":157000}'::jsonb, '- Débordement de 13 mn 
- Son du micro du dirigeant (léger écho) 
- Bip de l’afficheur à mettre off 
- Distribution de la sainte cène en retard 
- Avoir une équipe dehors pour « anakagzo » entre le lancement du culte et le début de la prédication 

À vérifier 
- Télécommande Ecodim défaillant : Respo  Valentin 
- Senteurs des toilettes à poser sur un meuble pour éviter l’accès aux enfants : Respo Blanche 
- Réparer la table de réception des nouveaux : Respo Blanche 

À planifier 
- Convoi C Pâques : planifier pour les plénières au stade de l’université . Intégrer dans les annonces / Valentin sera en charge convoi 
- Une veillée des serviteurs à préparer : 04  Avril 
- Les rdv des champions débuteront en avril : organiser une réunion d’organisation le Dimanche 30 après le culte / Chaque département doit se préparer / Le Pasteur confirmera la date de début.
', NULL, 'ke7348NhpO7P1bmHyKfi', '2025-03-24T10:46:08.144Z', '2026-06-14T00:37:07.322Z'),
('67ec918a-bca1-498c-902c-b5a0808d3579', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-07-16', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"specialOfferings":0,"tithes":30000,"regularOfferings":23500},"totalFinances":53500}'::jsonb, NULL, NULL, 'kyTqqBxRbXRv9dx7vGyC', '2025-07-20T15:46:37.051Z', '2026-06-14T00:37:07.488Z'),
('945353b8-2ff7-4dba-8176-c3a634cfc22c', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'af7fc398-3a8c-49ab-a784-919cd064e61c', '2025-12-03', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":251000,"regularOfferings":49400,"specialOfferings":0},"totalFinances":300400}'::jsonb, NULL, NULL, 'l0mP5dFSiWchcu2LD6Oy', '2025-12-04T17:57:35.629Z', '2026-06-14T00:37:07.660Z'),
('ca187245-58f3-41f2-b080-e816e4e9578d', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-06-25', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":20000,"regularOfferings":25000,"specialOfferings":0},"totalFinances":45000}'::jsonb, NULL, NULL, 'm08Cd1XixgoDAcGKprBD', '2025-06-26T15:28:23.166Z', '2026-06-14T00:37:07.820Z'),
('9dfd5d75-d4e1-4d31-8e3d-638c855ac79f', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-06-22', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"specialOfferings":10500,"regularOfferings":196000,"tithes":7650},"totalFinances":214150}'::jsonb, 'Coupure d’électricité : problème avec un câble ==== un électricien doit venir pour vérifier 
•⁠  ⁠L’électricien doit également vérifier les leds côté batterie 
•⁠  ⁠Débordement global du culte de 13 mn 
•⁠  ⁠Problèmes avec le micro du dirigeant  : test micro à faire 
•⁠  ⁠Son dans la salle fort et problèmes de sons dans la salle 
•⁠  ⁠Écouteurs à mettre à disposition pour le pianiste. 
•⁠  ⁠Entretien cette semaine à faire pour éradiquer les moustiques : tata Blanche ', NULL, 'mAJSv2iTJksT8C5JdNyA', '2025-06-23T12:00:14.037Z', '2026-06-14T00:37:07.978Z'),
('adb4cff1-9826-487f-8f96-4123fc2f0802', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-06-29', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":1118600,"regularOfferings":192650,"specialOfferings":15000},"totalFinances":1326250}'::jsonb, '•⁠  ⁠Débordement du message de 15 mn
•⁠  ⁠Débordement global de 7 mn 

Points de suivi 
•⁠  ⁠L’électricien doit également vérifier les leds côté batterie ( À faire mardi )
•⁠  ⁠Écouteurs à mettre à disposition pour le pianiste (À faire cette semaine) 
•⁠  ⁠Entretien cette semaine à faire pour éradiquer les moustiques (À faire cette semaine) 
', NULL, 'ml1MeCY0cmXxiiHrYadB', '2025-06-29T14:55:02.943Z', '2026-06-14T00:37:08.125Z'),
('2c0923b5-9303-44de-acf3-ddf9c09b2be5', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'b2329b43-6e57-445d-a280-99938c90911c', '2026-07-22', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"regularOfferings":25300,"specialOfferings":220440,"tithes":20000},"totalFinances":265740}'::jsonb, 'Les offrandes spéciales de 220440 fcfa sont destinées a la campagne IN SENEGAL.
MERCI SEIGNEUR', NULL, 'n0aQS3ZUkVyk46XatQdl', '2026-07-22T22:06:45.524Z', '2026-07-22T22:06:45.524Z'),
('36146803-8686-4210-a59c-f7ba87cfd269', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '82f18147-15ff-4d82-b4d9-048a20b0c764', '2026-01-21', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":0,"regularOfferings":33600,"specialOfferings":0},"totalFinances":33600}'::jsonb, NULL, NULL, 'nAdtq9KuYggvPIoQBl7m', '2026-05-04T14:01:06.601Z', '2026-06-14T00:37:08.266Z'),
('7e336fb3-4adc-48cd-b9bf-e036480978f4', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '593ae85a-a0df-479f-be1d-a91e5c86031b', '2026-04-17', '645cea6d-2969-47c8-9e61-c0ec50f3518e', 'JEUNE ET PRIERE ', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":0,"regularOfferings":41550,"specialOfferings":0},"totalFinances":41550}'::jsonb, 'Merci Seigneur.', NULL, 'nGK3p5evMvcLudk7kcEX', '2026-04-18T09:41:11.247Z', '2026-06-14T00:37:08.414Z'),
('295d3f5a-ddfa-4061-a0bd-1aec4770bdb2', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '5c5c2bf7-5a0c-4067-8d97-58ee09825ab0', '2025-02-23', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"totalFinances":473600,"finances":{"tithes":442300,"specialOfferings":0,"regularOfferings":31300}}'::jsonb, '-  Débordement  de 40 mn === les gens sont partis avant la fin du culte 
-  Diffusion des versets lente : planifier des formations hors des temps de culte 
•⁠  ⁠Omission de l’appel à conversion 
•⁠  ⁠01 seul nouveau = baisse des invitations et évangélisations 
', NULL, 'nNmOp0BldLDZoSq6rfNF', '2025-02-24T16:07:11.867Z', '2026-06-14T00:37:08.560Z'),
('9c3a625b-633f-4dce-84bb-4ada2865cebb', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'f107a8c3-a5d4-45ac-9e45-59286f7ff727', '2026-03-18', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":22000,"regularOfferings":16200,"specialOfferings":0},"totalFinances":38200}'::jsonb, 'Rendons grâce à DIEU', NULL, 'nQ1eaK3cZRYAXJ0Hg2mN', '2026-03-20T06:40:05.474Z', '2026-06-14T00:37:08.707Z'),
('978fa13c-4ac5-43dc-a387-341683db789b', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '3b3dde30-d30a-406b-8633-df3958922ef4', '2026-06-09', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":0,"regularOfferings":31050,"specialOfferings":0},"totalFinances":31050}'::jsonb, 'Pas de dîme ni d''offrandes spéciales.
A toi toute la gloire Seigneur.', NULL, 'nSgoC8EcQxFou2cX3YJJ', '2026-06-11T05:44:55.669Z', '2026-06-14T00:37:08.852Z'),
('447483f6-b09a-44aa-83c5-c78abb69ef8a', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-04-13', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":133300,"specialOfferings":815000,"regularOfferings":91700},"totalFinances":1040000}'::jsonb, 'Pas de nouveau : réactiver les invitations et l’évangélisation
•⁠  ⁠Poignée porte côté sono à réparer 
•⁠  ⁠Split de la salle annexe à réparer 
•⁠  ⁠Améliorer le rangement du matériel par la com / les portiers ….

À planifier 
 
•⁠  ⁠Une veillée des serviteurs à préparer : 25 Avril / thème + créa à diffuser 
•⁠  ⁠Les rdv des champions débuteront  le Mercredi 07 Mai / Chaque département doit se préparer
', NULL, 'nhTZFsp3bF7pFNrhZYge', '2025-04-13T13:56:00.903Z', '2026-06-14T00:37:09.000Z'),
('60c1f1a7-7c5a-4293-bdb4-3c42a726e83b', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '53cfefa8-eb8b-423b-a192-abdde6474029', '2025-11-19', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":70000,"regularOfferings":70067,"specialOfferings":0},"totalFinances":140067}'::jsonb, NULL, NULL, 'nymbEZuZaWUiATNZinOJ', '2025-11-21T14:21:05.176Z', '2026-06-14T00:37:09.142Z'),
('af907f05-a643-4818-a5d2-358dcccfc788', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'c9112034-d43b-4ec9-af14-f2f1612bf466', '2026-05-10', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":943000,"regularOfferings":79100,"specialOfferings":15000},"totalFinances":1037100}'::jsonb, 'Les offrandes spéciales de 15 000 f sont reparties comme suit:
              Semence mariage: 5000fcfa
                                 Tour 931:  10 000 fcfa
Merci Seigneur.', NULL, 'olVn5rAwWg7orM0g79uO', '2026-05-10T13:46:26.062Z', '2026-06-14T00:37:09.280Z'),
('efdfd59c-1482-446c-be22-64403d7b5dec', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-07-02', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"regularOfferings":49500,"specialOfferings":0,"tithes":800},"totalFinances":50300}'::jsonb, NULL, NULL, 'p0yNUCq1f76dPTdkXsdX', '2025-07-08T04:48:53.998Z', '2026-06-14T00:37:09.442Z'),
('32b1b4a2-a7b8-4809-8988-17a386bc19e2', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '429bdb1f-c9e5-4d5e-be10-655735c6ecda', '2026-06-28', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":113600,"regularOfferings":60400,"specialOfferings":55000},"totalFinances":229000}'::jsonb, 'L''offrande spéciale de 55 000f est destinée à la campagne IN SENEGAL.
Merci Seigneur pour toutes ces offrandes.', NULL, 'pJUIJ8m8jmHgPxSUTVB2', '2026-06-28T13:45:22.925Z', '2026-06-28T13:45:22.925Z'),
('9f623af5-edff-4a4d-9669-f0d00bc80a69', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'a979a27f-9a13-4700-9bbc-a8d66b691b1b', '2026-05-08', '068f255c-f24c-4e11-af66-607b8c42f229', 'Séminaire', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":50000,"regularOfferings":24500,"specialOfferings":981500},"totalFinances":1056000}'::jsonb, 'Les offrandes spéciales de 981500fcfa  representent des semences.
Point des 2 jours de seminaire
1er jour: dimes + offrandes = 30000+ 140400= 170400fcfa
2eme jour: dimes + offrandes+ semences = 50000+24500+ 981500
                                                                               = 1 056 000fcfa
Total 1er + 2eme = 1 226 400fcfa
Que le nom du Seigneur soit beni.', NULL, 'pfeLe40C1UgFSZQjTKrZ', '2026-05-10T07:58:21.217Z', '2026-06-14T00:37:09.584Z'),
('da655c00-8a76-4554-912b-83623caac9d1', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-08-27', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":454000,"specialOfferings":0,"regularOfferings":14000},"totalFinances":468000}'::jsonb, 'RAS', NULL, 'qER9J3nC8kwsRzDEZvHJ', '2025-08-28T19:54:02.636Z', '2026-06-14T00:37:09.742Z'),
('772ff4f3-5138-4acf-8549-fa8eab73e5da', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-07-13', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"specialOfferings":0,"regularOfferings":88300,"tithes":386710},"totalFinances":475010}'::jsonb, 'Le micro du chantre était plus fort que celui de la dirigeante 
•⁠  ⁠Arrivée de l’orateur 09h40
•⁠  ⁠Problème de son (micro de la dirigeante) lors de l’annonce du résumé du Tour 931
•⁠  ⁠La chanson de Bienvenue des nouveaux n’a pas été achevée.
•⁠  ⁠Débordement du culte de 20mn
', NULL, 'qVki57nif8Eu6MzHyUPP', '2025-07-14T11:58:01.293Z', '2026-06-14T00:37:09.901Z'),
('00e86a7d-1b4a-4e84-b20b-897aac667da6', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-09-14', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"totalFinances":481300,"finances":{"regularOfferings":100200,"tithes":196100,"specialOfferings":185000}}'::jsonb, 'offrandes spéciales pour l''appel pour la rentrée scolaire : 185 000
', NULL, 'qYPqHj5p0m8VbpQ0H715', '2025-09-14T18:54:44.143Z', '2026-06-14T00:37:10.051Z'),
('6e5f2344-e9cc-42e7-b097-da7e684486a2', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'a95956b3-d1ed-4f23-8be3-19e6816302ab', '2026-07-15', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":40000,"regularOfferings":32700,"specialOfferings":0},"totalFinances":72700}'::jsonb, 'Il n''y a pas eu d''offrandes speciales.
Que toute la gloire revienne à notre Seigneur Jesus Christ.', NULL, 'qq1w8OGvAHdwn5RlArS0', '2026-07-16T22:02:55.803Z', '2026-07-16T22:02:55.803Z'),
('4921f329-0adc-42c0-b456-6430a821f32d', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-04-27', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":324400,"regularOfferings":188350,"specialOfferings":0},"totalFinances":512750}'::jsonb, 'Débordement du message de 15 mn 
•⁠  ⁠Logistique absente : Elisée est affecté à la logistique pour supporter le frère Valentin 
•⁠  ⁠Incident avec le frère alcoolique pendant le culte et en dehors 
•⁠  ⁠Retard affichage des versets : PC lent 
•⁠  ⁠Déco en charge du nettoyage des portes : produit à acheter 
•⁠  ⁠Mettre en place une trousse d’urgence pour les 1ers soins : tata Blanche 

À planifier 
 
•⁠  ⁠Les rdv des champions débuteront  le Mercredi 07 Mai / Chaque département doit se préparer', NULL, 'r0aLE5aFfPHthCQ7g3Ug', '2025-04-28T19:21:32.907Z', '2026-06-14T00:37:10.193Z'),
('9a25de40-abeb-4e56-a90e-e078ca646eee', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'ea8bf60a-64c8-4954-948e-ec78832d13fa', '2025-11-02', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":527500,"regularOfferings":116900,"specialOfferings":147500},"totalFinances":791900}'::jsonb, 'OFFRANDES CJS : 147500', 'ENVELOPPES DIMES ', 'rKhTjDEXOhUoWezM5SdK', '2025-11-13T15:57:33.864Z', '2026-06-14T00:37:10.333Z'),
('a8b71f57-f8d6-4563-aaae-59d28bff34eb', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '50d75352-3ef9-44f6-bb15-a9e02d319185', '2024-12-22', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"totalFinances":311750,"finances":{"regularOfferings":58750,"specialOfferings":0,"tithes":253000}}'::jsonb, 'Débordement global de 32 mn 
Dirigeant : trop long a débordé de 4 mn 
Portiers : Attendre après la prière pour présenter le panier / Ligne des serviteurs non prise en compte / doivent rester concentrées quand elles sont devant attendant la prière pour les offrandes 
Chantres : Semblent perdues / Chant de bienvenue à fixer 
Sainte cène : se déploie trop tôt dans la salle dans la salle 
Prière des serviteurs : s’assurer d’être tous présents et impliqués dans la prière', NULL, 'sRQbdk4WdqrImsfFOKvp', '2025-05-24T11:05:26.721Z', '2026-06-14T00:37:10.471Z'),
('4c66c430-4611-4661-bb6d-fee2f0357086', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '0cbd6186-79f4-4259-9f46-724bb5de332c', '2025-12-14', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":672500,"regularOfferings":161400,"specialOfferings":606500},"totalFinances":1440400}'::jsonb, 'OFFRANDES SPECIALE UTT', NULL, 'saVCbE601MdCOlvMxIUF', '2025-12-18T12:24:54.289Z', '2026-06-14T00:37:10.608Z'),
('48d3c2f0-c8d1-4f0f-b75f-67adaafde758', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '9cc77857-627b-4a53-be59-d203bd35b677', '2025-02-02', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"totalFinances":915545,"finances":{"regularOfferings":205545,"tithes":710000,"specialOfferings":0}}'::jsonb, '
- Lancement d’un spot pour les offrandes pendant que le dirigeant parlait 
- Toilettes des femmes défectueuses 
- La température était basse dans la salle (vérifier les climatiseurs allumés et la température pendant le culte ) 
', NULL, 'skdRFPi9XQ8E0bPuPfFg', '2025-02-03T13:31:00.318Z', '2026-06-14T00:37:10.752Z'),
('4b52728b-a096-41d3-91f1-60572ef2e740', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-08-17', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"specialOfferings":0,"regularOfferings":59600,"tithes":402210},"totalFinances":461810}'::jsonb, NULL, NULL, 'sw2mbf96mmkUvEVr7Ff5', '2025-08-25T08:59:42.413Z', '2026-06-14T00:37:10.897Z'),
('dd23647d-63fe-4d1c-b449-415be1a8fd72', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-04-25', '6985bfef-b10d-4483-b032-7b3f8bde144f', 'Veillée de Prière', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":0,"specialOfferings":0,"regularOfferings":84700},"totalFinances":84700}'::jsonb, 'Coupure  de courant 
-Affichage des versets lent 
-Bruit des enfants dans la salle 
-Le pianiste absent de son poste après la coupure de courant 
', NULL, 't1U7XVQ712bM5jBuxwFf', '2025-04-28T19:29:38.419Z', '2026-06-14T00:37:11.038Z'),
('5336a3fb-5700-4232-88cb-96db4943eff4', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'd79bc7d8-65c0-446a-9d37-7a18010156af', '2026-06-07', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":476100,"regularOfferings":58300,"specialOfferings":0},"totalFinances":534400}'::jsonb, 'Pas d''offrandes spéciales.

Rendons grâce au DIEU.', NULL, 'tH3b3h8j3lx1DCOqR0GG', '2026-06-07T14:03:29.282Z', '2026-06-14T00:37:11.180Z'),
('2220a4af-688b-4139-b471-e893a1b4d955', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'd4743546-3b51-4757-8543-1df960277580', '2026-05-31', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":852700,"regularOfferings":132500,"specialOfferings":829150},"totalFinances":1814350}'::jsonb, 'Les offrandes speciales de 829.150 fcfa sont destinées aux semences C''Pentecôte.
Que toute la gloire revienne à notre Seigneur JESUS', NULL, 'tte13xcxy7gvjiST29Z6', '2026-05-31T15:27:03.664Z', '2026-06-14T00:37:11.327Z'),
('dafa3c32-8190-41a1-b63d-61fd1210acb6', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-09-21', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"totalFinances":474595,"finances":{"regularOfferings":91200,"tithes":283395,"specialOfferings":100000}}'::jsonb, '100 000 POUR LA SEMENCE DE LA RENTREEE; ', NULL, 'twXJToUXsYcdYXMrkQHX', '2025-09-21T15:44:50.901Z', '2026-06-14T00:37:11.487Z'),
('77f2b488-9eed-4a3d-bdc2-c9067d8d3bd9', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-05-07', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":500,"specialOfferings":0,"regularOfferings":18700},"totalFinances":19200}'::jsonb, NULL, NULL, 'u68xQmIOb5VmQkHIZ8kD', '2025-05-08T11:40:04.103Z', '2026-06-14T00:37:11.634Z'),
('bce6905c-7aea-48d6-a911-7c27dd91226f', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-09-10', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":56500,"specialOfferings":5000,"regularOfferings":37000},"totalFinances":98500}'::jsonb, '•⁠  ⁠Chantres en retard 
•⁠  ⁠Débordement 20 mn 
•⁠  ⁠Bruits émanant de la com pendant le culte 
', NULL, 'us6ZH539rwD682F4rCrc', '2025-09-11T13:50:02.563Z', '2026-06-14T00:37:11.769Z'),
('57294bd9-8078-4802-98b6-4647e70dcf94', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-06-18', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":22000,"specialOfferings":0,"regularOfferings":23700},"totalFinances":45700}'::jsonb, '•⁠  ⁠Le son était fort dans la salle au lancement du culte 
•⁠  ⁠Le micro du dirigeant ne fonctionnait pas à sa montée 
•⁠  ⁠Débordement du temps de prière par le dirigeant 
•⁠  ⁠Débordement global de 13mn 
', NULL, 'vECjYXGgpwEn3J1DDp9C', '2025-06-19T14:40:02.053Z', '2026-06-14T00:37:11.934Z'),
('abc3cc52-0694-4ed7-b68e-b285609cc33f', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-05-21', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"specialOfferings":0,"tithes":9958,"regularOfferings":16700},"totalFinances":26658}'::jsonb, 'Observations :

-Quelques problèmes techniques au niveau de la sono
•⁠  ⁠Problème de son avec le micro du dirigeant 
•⁠  ⁠Débordement du message de 12mn 
', NULL, 'vQT1UGaQy6o27MVRLl9a', '2025-05-22T09:58:12.962Z', '2026-06-14T00:37:12.074Z'),
('6f7fc1d1-09f8-4118-8636-bdd07a25658d', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-07-06', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"regularOfferings":463700,"tithes":1588500,"specialOfferings":100000},"totalFinances":2152200}'::jsonb, NULL, NULL, 'vruXcr9NXhQpgpcYgup7', '2025-07-08T04:53:56.094Z', '2026-06-14T00:37:12.212Z'),
('d7aaa6f1-306c-4811-b871-0e5067b83d8f', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'b5ecc981-2e7f-4af2-8c19-49b156e5b5f9', '2025-02-16', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"totalFinances":283900,"finances":{"tithes":183000,"regularOfferings":100900,"specialOfferings":0}}'::jsonb, ' -  Les chantres ont eu du mal à lancer le premier chant  / Chant des nouveaux mal exécuté par le groupe musical
•⁠  ⁠Installation des portiers à harmoniser 
•⁠  ⁠La coordination entre la com et la sono 
•⁠  ⁠Veiller à la sécurité de l’entrée principale pendant le culte 
•⁠  ⁠Débordement de 30 mn sur le temps de la prédication 
•⁠  ⁠Cas des enfants qui ne peuvent pas aller à l’ecodim : pleurs dans la salle principale 
•⁠  ⁠Problèmes de sons pendant la good news 
•⁠  ⁠La Com a utilisé les good news de la semaine passée : veillez à la mise à jour
•⁠  ⁠Gestion des cultes : Prévoir des plateaux pour l’onction d’huile / Mieux préparer le plan de circulation 
•⁠  ⁠La porte côté sono ne ferme pas bien 
•⁠  ⁠Senteurs et savons à remplacer dans les toilettes 
', NULL, 'vwL2We8weJ4tDHsYwEQQ', '2025-02-16T14:35:32.947Z', '2026-06-14T00:37:12.352Z'),
('b3b262c1-51cb-4ddd-b9c4-ec9da4743ea2', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '84a7bceb-396a-4e80-acb3-de23e9a9a703', '2025-11-05', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":209000,"regularOfferings":73547,"specialOfferings":0},"totalFinances":282547}'::jsonb, NULL, NULL, 'wI55aTCDv8NbMtQEGkm2', '2025-11-13T16:02:01.841Z', '2026-06-14T00:37:12.489Z'),
('52f874c3-cf45-4a8d-a904-ca41ca9207a0', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-08-13', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"regularOfferings":24100,"specialOfferings":0,"tithes":1500},"totalFinances":25600}'::jsonb, NULL, NULL, 'wYJAYL3MC8h23x8MMUjd', '2025-08-14T13:50:59.271Z', '2026-06-14T00:37:12.624Z'),
('9e70531e-131f-4ee6-99e9-7395c2b88c83', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '4ba42de4-cd3a-48e4-bdc4-47113925dc3a', '2024-12-29', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"totalFinances":754475,"finances":{"tithes":527000,"specialOfferings":0,"regularOfferings":227475}}'::jsonb, 'Débordement global de 32 mn 
Retard de lancement de 05 mn pour la préparation des chantres 
Com : Incident , vidéo diffusée en 12mn au lieu de 27 mn 
Portiers : installation sur la droite de la salle 
Crea à Annonce 1er culte de l’année aux couleurs arc en ciel 
', NULL, 'wYNVye6RzuwLiI9eLAEw', '2025-05-24T11:08:38.843Z', '2026-06-14T00:37:12.771Z'),
('9b365d57-03c7-46ce-b939-b8c254c9973c', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '65d560a2-b85d-408c-b972-1dad335e8ba6', '2025-11-12', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":124600,"regularOfferings":30800,"specialOfferings":0},"totalFinances":155400}'::jsonb, NULL, NULL, 'x5xbxddq95OPKzvAzJGY', '2025-11-13T16:14:18.753Z', '2026-06-14T00:37:12.911Z'),
('86db4aa9-37ec-4281-a8cf-7f98b697e5c2', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'cc2cf92e-4689-4ec9-bc2c-1ad27fc424fd', '2026-05-24', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":47650,"regularOfferings":127600,"specialOfferings":997000},"totalFinances":1172250}'::jsonb, 'Les offrandes speciales de 997 000 sont reparties comme suit:
 - Semences spéciales C''pentecôte: 992 000fcfa
 - semence Tour 931 : 5000fcfa
Merci Saint-Esprit.', NULL, 'x7cKNjYAFI5L4kzy1cTC', '2026-05-24T19:51:32.319Z', '2026-06-14T00:37:13.138Z'),
('84031501-4ed7-407f-a596-65566395d646', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-06-15', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"specialOfferings":0,"regularOfferings":114600,"tithes":431200},"totalFinances":545800}'::jsonb, '-Problèmes de sons avec le micro de la dirigeante en début
-problème avec micro du pasteur 
-son faible chez le pianiste 
Manque de coordination dans la distribution des cadeaux 
La vidéo de bonne fête du Pasteur Liliane est passée à la fin au lieu du début 
Le pianiste programmer n''est pas venu. ', NULL, 'xeFSFwFS9OnawMhPpuBT', '2025-06-16T18:09:30.290Z', '2026-06-14T00:37:13.297Z'),
('9ead354e-ac55-44e8-ad52-bb2236662e7a', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '946dfd3e-b43c-41d6-89c8-86d36426bd51', '2026-04-19', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":7000,"regularOfferings":119700,"specialOfferings":40000},"totalFinances":166700}'::jsonb, 'Les premices d''un montant de 1500f ont été intégrés dans les offrandes. Aussi, comme offrandes spéciales nous avons 40 000fcfa destinés au Tour 931.
Merci Seigneur.', NULL, 'xzIV6cC0l7qiGapm4E1e', '2026-04-19T14:43:52.421Z', '2026-06-14T00:37:13.445Z'),
('88442d88-de67-4ed5-8874-6ec1ebae21ff', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '367d1baf-533d-4ae4-858c-8e1e6f9c516d', '2026-03-31', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":0,"regularOfferings":15500,"specialOfferings":0},"totalFinances":15500}'::jsonb, NULL, NULL, 'yMGd6NfNF64GMHBXZmcE', '2026-04-02T22:42:26.000Z', '2026-06-14T00:37:13.592Z'),
('4f3ed57c-2579-4d4e-b030-73972f9d862d', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '5b8c8dc1-ac6b-4edf-9e7c-76a1295ce095', '2025-01-12', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"totalFinances":275450,"finances":{"tithes":88250,"specialOfferings":105000,"regularOfferings":82200}}'::jsonb, 'Débordement timing de 05 Mn 
Problème d''ouverture de la porte de la salle qui mène vers la sainte Cène
Problème d''ouverture de la porte des toilettes dames
Boss Sono arrivée en Retard
Gestion des culte Assurer par le Responsable TANO. 
Besoin d''ouvrier à la Gestion des culte et à la Sainte Cène.
Petite distraction au niveau de la distribution de la Sainte Cène. 
Les boss doivent amplifier les évangélisation et les invitations personnelles.  
', NULL, 'yP3pCgNAO6Gmb6AjDVdH', '2025-01-16T12:50:30.423Z', '2026-06-14T00:37:13.747Z'),
('a052da9e-0edf-4e6a-b199-d195f2a419cf', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-08-06', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"regularOfferings":28600,"tithes":45000,"specialOfferings":0},"totalFinances":73600}'::jsonb, '•⁠  ⁠Gestion des cultes en retard
•⁠  ⁠Débordement global de 20 mn', NULL, 'yfS8KxQmJdIwchgirI7w', '2025-08-08T12:44:38.933Z', '2026-06-14T00:37:13.887Z'),
('b289704b-a69d-4561-917e-c91c9982e00c', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', 'e9c5dbf9-6a24-492e-9d45-f5fd8fa38d30', '2026-04-23', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":25000,"regularOfferings":29200,"specialOfferings":10000},"totalFinances":64200}'::jsonb, 'Les offrandes speciales de 10 000 fcfa sont destinées  au Tour 931.

Nous rendons grâce à DIEU.', NULL, 'ynBs66wSJfJ89BDHfsxJ', '2026-04-24T06:23:08.294Z', '2026-06-14T00:37:14.044Z'),
('bb6dc356-7684-4aca-9434-d411805a6f9b', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', NULL, '2025-03-16', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":400000,"regularOfferings":126829,"specialOfferings":0},"totalFinances":526829}'::jsonb, '•⁠  ⁠12 mn de débordement
•⁠  ⁠Gestion des cultes absente de la salle au lancement du culte 
•⁠  ⁠Problèmes de son / Problèmes avec le micro du Pasteur / Pas de réaction de la gestion des cultes 
•⁠  ⁠Lenteur affichage des versets 
•⁠  ⁠Bip de l’afficheur à mettre off 
•⁠  ⁠Distribution de la sainte cène en retard 
•⁠  ⁠Avoir une équipe dehors pour « anakagzo » entre le lancement du culte et le début de la prédication 

À vérifier 
•⁠  ⁠Télécommande Ecodim défaillante : Respo  Valentin 
•⁠  ⁠Senteurs des toilettes à poser sur un meuble pour éviter l’accès aux enfants : Respo Blanche 
•⁠  ⁠Réparer la table de réception des nouveaux : Respo Blanche 
•⁠  ⁠Plinthe à réparer dans la salle : Respo Blanche 

À planifier 
•⁠  ⁠Convoi C Pâques : planifier pour les plénières au stade de l’université . Intégrer dans les annonces / Valentin sera en charge convoi 
•⁠  ⁠Une veillée des serviteurs à préparer : 04  Avril 
•⁠  ⁠Les rdv des champions débuteront en avril : Chaque département doit se préparer / Le Pasteur confirmera la date de début 
', NULL, 'z7cq3yf8xDYzrAqKNsgx', '2025-03-17T11:18:38.320Z', '2026-06-14T00:37:14.186Z'),
('f3673c23-dac1-4594-bcef-a74ebe829db5', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '296de74c-65e0-4cd6-bd1f-d23158dacc7b', '2026-06-07', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":690200,"regularOfferings":165200,"specialOfferings":8000},"totalFinances":863400}'::jsonb, 'Les offrandes speciales de 8000 sont constituées de 4000 comme semence destinée à KODESH ( terrain: 2000, Auditorium : 2000) et 4000 semence destinée à l''AGC.
POINT DES 1er  et 2ème culte
Dîme: 476 100+690200= 1 166 300
Offrandes: 58 300+ 165 400= 223 700
Offrandes speciales: 8000
Total : 1 166 300 + 223 700 + 8000 
            = 1 398 000
Toute la gloire revient à notre Seigneur JESUS CHRIST.
', NULL, 'zAuCoS8JvJiAJXy7m7Oa', '2026-06-07T14:42:05.147Z', '2026-06-14T00:37:14.343Z'),
('04500073-1e85-432b-986e-b9ec43879d1a', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '2b83eb5e-92e4-4369-bef7-bf579640284c', '2024-12-01', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"totalFinances":259800,"finances":{"tithes":60000,"specialOfferings":0,"regularOfferings":199800}}'::jsonb, '- Lancement en retards
- problème de son au niveau des vidéos
- Vidéos plantés
- Retard des serviteurs 
- Absence serviteurs de la sono. 

Appel à conversion: 7 personnes 
', NULL, 'zQMeWLVGsmDomfjI8EIk', '2025-01-04T18:37:36.338Z', '2026-06-14T00:37:14.489Z'),
('fcf39e66-53fd-442d-aad8-eae158b93e18', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '38bc715e-6552-453d-8aca-00cdfe49efcf', '2026-07-05', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":404000,"regularOfferings":110700,"specialOfferings":256000},"totalFinances":770700}'::jsonb, 'Les offrandes spéciales de 256000f sont destinées à la campagne IN SENEGAL.
POINT DES 1er et 2ème CULTE
Total 1er et 2eme culte
Offrandes: 44800 + 110700 = 155500f
Dimes: 293000+ 404000 = 
697000f
Offrandes IN SENEGAL = 258700 + 256000= 514700f
Total Géneral: 1 367 200fcfa
Merci Seigneur.
 ', NULL, 'zYIcdXBAF5SBMiuhxMXK', '2026-07-05T14:35:19.419Z', '2026-07-05T14:35:19.419Z'),
('08d51438-5585-46ef-b668-98523d6f0dc5', 'bergerie', 'finance', '3fa95150-5fe0-4f0a-a78b-6b76d16bf265', 'FINANCE', '17b7012d-384e-4a76-95a1-ec139d1eb85f', '2026-05-13', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', NULL, 'Inconnu (ancien système)', '{"finances":{"tithes":62600,"regularOfferings":88400,"specialOfferings":10000},"totalFinances":161000}'::jsonb, 'L''offrande spéciale de 10 000f est destinée aux semences du mariage.

Merci Seigneur.', NULL, 'zzEr2bgEQuVfimFC91L2', '2026-05-15T12:21:56.415Z', '2026-06-14T00:37:14.637Z'),
('91906280-b50a-43e3-b09f-8e6e9987e593', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', 'd4743546-3b51-4757-8543-1df960277580', '2026-05-31', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":90,"vinsPreparees":90,"painsDistribuees":57,"vinsDistribuees":57,"painsRestantes":33,"vinsRestantes":33}'::jsonb, NULL, 'Rien à signaler ', '0Vz4WTFT1vOkFArIxu90', '2026-06-02T06:54:17.804Z', '2026-06-02T06:54:17.804Z'),
('ddc9df68-907b-40b3-9086-a5cc136344bb', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', 'd79bc7d8-65c0-446a-9d37-7a18010156af', '2026-06-07', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":90,"vinsPreparees":90,"painsDistribuees":51,"vinsDistribuees":51,"painsRestantes":39,"vinsRestantes":39}'::jsonb, NULL, 'Rien à signaler ', '0YqujgNOestRlvkPITi9', '2026-06-07T14:03:55.901Z', '2026-06-07T14:03:55.901Z'),
('1238c2e7-831f-43c3-b771-229d988d70fa', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '7fa9e005-6a0e-4ab9-a2b1-c05f89b86258', '2026-05-24', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":75,"vinsPreparees":75,"painsDistribuees":71,"vinsDistribuees":71,"painsRestantes":4,"vinsRestantes":4}'::jsonb, NULL, 'Rien à signaler ', '3GwEWtog1ljKQ3zfJMnK', '2026-05-26T05:56:17.345Z', '2026-05-26T05:56:17.345Z'),
('1caf534f-c859-46ed-8dbf-eb72e148bf4b', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '54896d20-094d-4a65-bf37-cd56cdfe7b98', '2026-04-12', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":90,"vinsPreparees":135,"painsDistribuees":36,"vinsDistribuees":62,"painsRestantes":54,"vinsRestantes":73}'::jsonb, NULL, 'Rien à signaler ', '4CT6zbktQu1XDCfdbKSq', '2026-04-12T13:09:28.135Z', '2026-04-12T13:09:28.135Z'),
('91089556-2a7a-431d-99d7-ade688c1a1ac', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '235b3427-92c9-4466-8553-dd5fdd56699e', '2026-05-31', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":92,"vinsPreparees":92,"painsDistribuees":92,"vinsDistribuees":92,"painsRestantes":0,"vinsRestantes":0}'::jsonb, NULL, 'Rien à signaler ', '4bb1jnXF6aOumUhgEXry', '2026-06-02T06:55:31.025Z', '2026-06-02T06:55:31.025Z'),
('34984b05-b434-4f54-8ee8-3c6bc55f82b7', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '296de74c-65e0-4cd6-bd1f-d23158dacc7b', '2026-06-07', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":75,"vinsPreparees":75,"painsDistribuees":44,"vinsDistribuees":44,"painsRestantes":31,"vinsRestantes":31}'::jsonb, NULL, 'Rien à signaler ', '6Zj9NSrBWujVh4r2jTDe', '2026-06-07T14:04:41.327Z', '2026-06-07T14:04:41.327Z'),
('d1fabd93-1177-4899-a03f-4765a7427820', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '9c28739c-04cd-46e0-af1d-a9ea207b3ba8', '2026-07-19', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsDistribuees":56,"vinsPreparees":77,"painsPreparees":77,"vinsRestantes":21,"painsRestantes":21,"vinsDistribuees":56}'::jsonb, NULL, NULL, 'Asc3DdREJ1IcShdjj1nE', '2026-07-19T15:34:43.217Z', '2026-07-19T15:34:43.217Z'),
('f2519218-fcc2-4122-b958-56dd52ba6df0', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', 'ecabcabd-6ed3-4155-bac2-a33a668c579b', '2026-04-12', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":90,"vinsPreparees":135,"painsDistribuees":44,"vinsDistribuees":62,"painsRestantes":46,"vinsRestantes":73}'::jsonb, NULL, 'Rien à signaler ', 'F9M4yDYLMvZpL1XdlwIf', '2026-04-12T14:14:40.538Z', '2026-04-12T14:14:40.538Z'),
('79d17cf6-2152-41ae-babc-a92224fde5e0', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '946dfd3e-b43c-41d6-89c8-86d36426bd51', '2026-04-19', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":90,"vinsPreparees":135,"painsDistribuees":50,"vinsDistribuees":50,"painsRestantes":40,"vinsRestantes":85}'::jsonb, NULL, 'Rien  à  signaler ', 'FvsGmroymoS5qH5ex7BU', '2026-04-24T08:45:23.947Z', '2026-04-24T08:45:23.947Z'),
('3a380938-44c5-4d3a-a6a2-abdd75801916', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', 'f7c81d0b-aef8-4ba7-8b51-d59b1ea5d1ef', '2026-07-12', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":75,"vinsPreparees":75,"painsDistribuees":27,"vinsDistribuees":27,"painsRestantes":48,"vinsRestantes":48}'::jsonb, NULL, NULL, 'G6ydezSp61prvPsJ5tSY', '2026-07-12T14:13:02.020Z', '2026-07-12T14:13:02.020Z'),
('ff9a9356-5525-42a0-b3d0-fd208ce867d1', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '0c1a3390-8ba2-46aa-b079-e1687299282d', '2026-07-19', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"vinsRestantes":49,"vinsPreparees":75,"painsRestantes":49,"painsDistribuees":26,"painsPreparees":75,"vinsDistribuees":26}'::jsonb, NULL, NULL, 'HhpMdqgT8hujaHmRTV3S', '2026-07-19T15:32:51.434Z', '2026-07-19T15:32:51.434Z'),
('4aa49ae2-ac4b-4cdb-b3ae-6fdf1e2343c0', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', 'a0c7937a-4c6d-4fd3-b2ce-c3b28daa3266', '2026-06-21', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":90,"vinsPreparees":90,"painsDistribuees":71,"vinsDistribuees":71,"painsRestantes":19,"vinsRestantes":19}'::jsonb, NULL, NULL, 'IFhIYBBuKG2RihDzBTZ1', '2026-06-21T14:34:23.105Z', '2026-06-21T14:34:23.105Z'),
('b2ae2888-ae6e-4bf4-ba62-575f21f677d5', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '2f004f21-7637-4d95-80b1-e12bb097d1a7', '2026-04-19', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":90,"vinsPreparees":100,"painsDistribuees":70,"vinsDistribuees":80,"painsRestantes":20,"vinsRestantes":20}'::jsonb, NULL, 'Rien à signaler ', 'IOpnVTlanCk8kcVRvgdf', '2026-04-24T08:49:16.262Z', '2026-04-24T08:49:16.262Z'),
('32b8552b-8bb2-458c-abc0-e890630e7c84', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', 'cc2cf92e-4689-4ec9-bc2c-1ad27fc424fd', '2026-05-24', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":90,"vinsPreparees":90,"painsDistribuees":39,"vinsDistribuees":39,"painsRestantes":51,"vinsRestantes":51}'::jsonb, NULL, 'Rien à signaler ', 'JZEzqfGSgTPnmrbyyk1K', '2026-05-24T11:32:42.756Z', '2026-05-24T11:32:42.756Z'),
('05817b39-070a-419b-b823-c4007693dda9', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '98f70ece-b1aa-4638-b783-6ad10349d143', '2026-04-05', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":90,"vinsPreparees":90,"painsDistribuees":87,"vinsDistribuees":90,"painsRestantes":3,"vinsRestantes":0}'::jsonb, NULL, 'Rien', 'KrZh2QgbrVbiaVzXi0bh', '2026-04-05T13:08:18.281Z', '2026-04-05T13:08:18.281Z'),
('0ece44af-54aa-4f43-8535-d8413d9ad9b2', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '42cc37f8-d413-492c-baa3-8a40c0caa5bc', '2026-03-29', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":90,"vinsPreparees":84,"painsDistribuees":79,"vinsDistribuees":72,"painsRestantes":11,"vinsRestantes":12}'::jsonb, NULL, 'Rien ne manque', 'O6kJp626jXfXfpoiiqav', '2026-03-30T06:45:32.993Z', '2026-03-30T06:45:32.993Z'),
('f2e596fc-70b7-4cab-b152-6923422b8c6a', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '03c52141-7309-40e0-9900-9c637ecffb0e', '2026-06-28', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":90,"vinsPreparees":90,"painsDistribuees":58,"vinsDistribuees":58,"painsRestantes":32,"vinsRestantes":32}'::jsonb, NULL, 'Comprimés de stérilisation ', 'OieF2Z4O9SZv3SLgy7iN', '2026-06-28T14:52:51.440Z', '2026-06-28T14:52:51.440Z'),
('d2bd56f9-1b40-416b-a697-3102e6f7bb2e', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '38bc715e-6552-453d-8aca-00cdfe49efcf', '2026-07-05', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":97,"vinsPreparees":97,"painsDistribuees":69,"vinsDistribuees":69,"painsRestantes":28,"vinsRestantes":28}'::jsonb, NULL, NULL, 'PkpDZH8FvyNfxqP59SCT', '2026-07-05T14:59:30.051Z', '2026-07-05T14:59:30.051Z'),
('a79deba5-3714-42d7-a6f8-7eac4cf059f7', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '04834f9c-2e77-4b27-b4f1-0749312e4b1a', '2026-05-17', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":90,"vinsPreparees":90,"painsDistribuees":49,"vinsDistribuees":50,"painsRestantes":41,"vinsRestantes":40}'::jsonb, NULL, 'Rien à signaler ', 'TD7XQWTmywWIpKOUu1nd', '2026-05-17T15:01:44.595Z', '2026-05-17T15:01:44.595Z'),
('8747745b-3f96-4058-89d6-7fd3d185b502', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', 'c5f8d3c5-b9b8-42fd-8d22-171f3178e2cb', '2026-06-21', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":75,"vinsPreparees":75,"painsDistribuees":44,"vinsDistribuees":44,"painsRestantes":31,"vinsRestantes":31}'::jsonb, NULL, NULL, 'TPhi8OLephWzU6d79K5F', '2026-06-21T14:32:38.626Z', '2026-06-21T14:32:38.626Z'),
('abc6d6ae-1c71-46ec-8482-d340a763a391', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '8d7cd2cc-7af1-4772-99ea-eca14ca399fc', '2026-05-03', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":45,"vinsPreparees":45,"painsDistribuees":45,"vinsDistribuees":43,"painsRestantes":0,"vinsRestantes":2}'::jsonb, NULL, 'Rien à signaler ', 'TrxR9zUrIBXjadPO7n3J', '2026-05-07T19:42:52.675Z', '2026-05-07T19:42:52.675Z'),
('a64f3ab4-1dcf-4e8e-a16a-9dc31752b6d2', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '67184362-581b-4dd1-8569-a2619ad00c7a', '2026-05-17', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":75,"vinsPreparees":75,"painsDistribuees":54,"vinsDistribuees":73,"painsRestantes":21,"vinsRestantes":2}'::jsonb, NULL, 'Rien à signaler ', 'X6oCozwDzIME1Ka3lW74', '2026-05-17T15:03:24.771Z', '2026-05-17T15:03:24.771Z'),
('b90ef439-bc6e-4fc0-9526-6d045a0b372a', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '8cbf331e-f9bc-4c66-b908-a5c5fcf24239', '2026-03-01', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":84,"vinsPreparees":81,"painsDistribuees":72,"vinsDistribuees":67,"painsRestantes":12,"vinsRestantes":14}'::jsonb, NULL, NULL, 'esviKHmMibQX2iYMmEmr', '2026-03-01T13:19:27.811Z', '2026-03-01T13:19:27.811Z'),
('9429677b-be0d-4874-9b46-6b0d9b8857cb', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '1d2891de-e0ca-487d-a152-be003fba5733', '2026-03-08', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":90,"vinsPreparees":81,"painsDistribuees":81,"vinsDistribuees":81,"painsRestantes":9,"vinsRestantes":0}'::jsonb, NULL, '2 Papier alu
2 boîte de gant', 'f1NRazpba3yZjoYS6HZY', '2026-03-08T14:25:54.814Z', '2026-03-08T14:25:54.814Z'),
('7e772291-f258-4783-b47f-f54528319195', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '2d38d1c5-8668-4771-9f0c-e3b992937e9f', '2026-04-26', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":90,"vinsPreparees":110,"painsDistribuees":85,"vinsDistribuees":100,"painsRestantes":5,"vinsRestantes":10}'::jsonb, NULL, 'Rien à signaler ', 'jZOFgee4zlXJ5X5GFm7d', '2026-04-26T17:25:50.796Z', '2026-04-26T17:25:50.796Z'),
('de51f66a-150f-4caf-ba48-e0ff8c8b8894', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '429bdb1f-c9e5-4d5e-be10-655735c6ecda', '2026-06-28', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":75,"vinsPreparees":75,"painsDistribuees":31,"vinsDistribuees":31,"painsRestantes":44,"vinsRestantes":44}'::jsonb, NULL, 'Milton comprimés de stérilisation ', 'mFhGxYNozaPFkEfyVB4n', '2026-06-28T13:50:32.262Z', '2026-06-28T13:50:32.262Z'),
('0a9ed798-84e5-49f3-9bb4-3d0fc3ebd720', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', 'c9112034-d43b-4ec9-af14-f2f1612bf466', '2026-05-10', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":90,"vinsPreparees":90,"painsDistribuees":57,"vinsDistribuees":57,"painsRestantes":33,"vinsRestantes":33}'::jsonb, NULL, 'Rien à signaler ', 'mx4Shl1KJosEWr2Z4osS', '2026-05-10T13:53:03.231Z', '2026-05-10T13:53:03.231Z'),
('bdd8da67-eb72-46f6-bcba-1615164f3205', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', 'f5f2c26a-036f-4748-a266-4d5ce4186c8a', '2026-03-22', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":90,"vinsPreparees":84,"painsDistribuees":82,"vinsDistribuees":84,"painsRestantes":8,"vinsRestantes":0}'::jsonb, NULL, 'Pains de Sainte Cène ', 'nxWZjaGzQzIeLwQLGF3I', '2026-03-22T13:36:35.653Z', '2026-03-22T13:36:35.653Z'),
('ca82af8d-795c-4f49-bb66-2b9bba98c2d3', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', 'e84f5357-d160-4b32-888e-b265ea020a87', '2026-06-14', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":92,"vinsPreparees":92,"painsDistribuees":44,"vinsDistribuees":41,"painsRestantes":48,"vinsRestantes":51}'::jsonb, NULL, 'Papier allu', 'pb6jBWOtL8YJjoR2UgMU', '2026-06-14T14:10:45.378Z', '2026-06-14T14:10:45.378Z'),
('3c3819dc-f509-4708-ac70-29232c2c7391', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', 'b6147bbb-9f8a-4d72-9252-88ba82e398dd', '2026-07-05', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":75,"vinsPreparees":75,"painsDistribuees":26,"vinsDistribuees":26,"painsRestantes":49,"vinsRestantes":49}'::jsonb, NULL, NULL, 'rBkfv2SATTu193oOxqot', '2026-07-05T14:57:39.700Z', '2026-07-05T14:57:39.700Z'),
('3db57627-0df3-4fa7-b2fd-c9f34931280c', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '7e2d4cbd-b886-4ef5-bdea-4536135b5005', '2026-03-15', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":90,"vinsPreparees":84,"painsDistribuees":75,"vinsDistribuees":70,"painsRestantes":15,"vinsRestantes":14}'::jsonb, NULL, 'Papier aluminium, gant, cache nez', 'rRD5t9KSjuqRpPHQ35Iy', '2026-03-22T13:39:43.524Z', '2026-03-22T13:39:43.524Z'),
('353f8e0e-ac3c-4844-bc44-0a0626a69c28', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '6968898e-a9de-48f6-84c1-b9939442f7fb', '2026-02-22', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":81,"vinsPreparees":81,"painsDistribuees":71,"vinsDistribuees":71,"painsRestantes":10,"vinsRestantes":10}'::jsonb, NULL, 'RAS', 'uNbMgKIRSTgOTuIQBHA5', '2026-02-22T14:29:29.372Z', '2026-02-22T14:29:29.372Z'),
('3c49441a-d89e-421d-aff9-050b28993da6', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', 'a39a724e-8526-4b7b-a05c-3aeefdb5938c', '2026-05-10', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":75,"vinsPreparees":75,"painsDistribuees":56,"vinsDistribuees":56,"painsRestantes":19,"vinsRestantes":19}'::jsonb, NULL, 'Rien à signaler ', 'wBwrVRtQx3ejYCbOmVMN', '2026-05-10T14:37:51.775Z', '2026-05-10T14:37:51.775Z'),
('7de9e274-d091-4811-902a-bba0fe88e590', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '7e1023bd-0964-41a3-8f28-869588fe227c', '2026-06-14', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":75,"vinsPreparees":75,"painsDistribuees":49,"vinsDistribuees":52,"painsRestantes":26,"vinsRestantes":23}'::jsonb, NULL, NULL, 'xL0D6e4LQ3FNpuQxlW3v', '2026-06-14T14:12:25.142Z', '2026-06-14T14:12:25.142Z'),
('6342c388-7c3b-48b4-8e46-75de8b7bbd42', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', 'cc4a585c-0aa3-4c9b-82cb-0c79a60f35d2', '2026-07-12', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":97,"vinsPreparees":97,"painsDistribuees":64,"vinsDistribuees":64,"painsRestantes":33,"vinsRestantes":33}'::jsonb, NULL, NULL, 'xhaKxX0fFpG7mGPEGhFw', '2026-07-12T14:18:47.817Z', '2026-07-12T14:18:47.817Z'),
('e30b8dc7-b441-4b04-9174-73f2876d7148', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '1518ce1a-d65e-49df-80a9-4efbfc9c4fee', '2026-04-26', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":135,"vinsPreparees":90,"painsDistribuees":50,"vinsDistribuees":50,"painsRestantes":85,"vinsRestantes":40}'::jsonb, NULL, 'Rien a signaler', 'yYxIAwoaDFsV7y7AspdI', '2026-04-26T13:38:07.907Z', '2026-04-26T13:38:07.907Z'),
('caea9a87-006e-4608-9a4a-98849dbed280', 'bergerie', 'sainte_cene', 'lAdLXujrJNKr8PDy5DEH', 'SAINTE CENE', '8ab6559b-92c2-4f93-b5db-3a818cd9d43f', '2026-05-03', NULL, NULL, '1njzfrTDWeQY7ZoT6SMG', 'GA BLANCHE AKOUBET', '{"painsPreparees":70,"vinsPreparees":70,"painsDistribuees":50,"vinsDistribuees":50,"painsRestantes":20,"vinsRestantes":20}'::jsonb, NULL, 'Rien à signaler ', 'yqW9MS1qEvBDF6PlmahF', '2026-05-07T19:44:27.966Z', '2026-05-07T19:44:27.966Z'),
('250c04a8-b09b-4f09-acd8-81a521a0a2b7', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', 'f5f2c26a-036f-4748-a266-4d5ce4186c8a', '2026-03-22', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI"},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK"}}'::jsonb, NULL, NULL, '2gzFQNo9J8PR4Nlu3Za7', '2026-03-29T13:45:11.276Z', '2026-03-29T13:45:11.276Z'),
('30bbc3b1-3c67-4ec8-b519-bf900986046f', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', 'a39a724e-8526-4b7b-a05c-3aeefdb5938c', '2026-05-10', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI"},"afterService":{"servantsPhotos":"NON_EFFECTUEE","photoMasking":"NON_EFFECTUEE","audioReplayPublication":"NOK","videoReplayPublication":"EN_COURS","fileArchiving":"OK"},"generalObservations":"DIFFICULTÉS ET PROBLÈMES OBSERVÉS\n\nPlusieurs difficultés et problèmes ont été relevés durant le service :\n\n* Formation à la baladeuse :\n    Anne Esther et Yannick ne sont pas encore formés à l’utilisation de la baladeuse. Cette situation fait que Judicaël reste seul sur cette responsabilité, et son absence impacte directement le dynamisme de la régie vidéo.\n* Ressources humaines :\n    L’équipe manque de diversification dans les profils et les compétences, ce qui entraîne une surcharge pour certains membres et une forte concentration des responsabilités sur quelques personnes.\n* Incident technique :\n    Sheryl a signalé des ralentissements de la caméra durant le culte.\n* Matériel défectueux :\n    * Le câble HDMI est défectueux et doit être remplacé.\n    * La télécommande de l’Ecodim est également défectueuse et doit être remplacée.\n    * La connexion internet impacte parfois la qualité du travail vidéo.\n* Logiciels :\n    Certains logiciels nécessaires au bon fonctionnement de la COM ne sont pas disponibles.\n* Organisation technique :\n    Les responsabilités liées à la régie, au mélangeur et au montage vidéo ne sont pas encore suffisamment séparées.\n* Gestion des contenus et timing :\n    Le montage des vidéos des Good News se fait souvent alors que le culte a déjà démarré, à cause de nouveaux éléments transmis à la COM au moment même du culte.\n* Créas de dernière minute :\n    Certaines demandes urgentes, comme la créa du convoi CPENTECOTE, ont créé une distraction pour la ressource en charge de la régie, car cette même ressource devait également gérer les montages et les créas en parallèle.\n\nSOLUTIONS PROPOSÉES\n\n* Formation :\n    Judicaël assurera la formation d’Anne Esther et Yannick à l’utilisation de la baladeuse.\n* Réorganisation RH :\n    Revoir la répartition des tâches dès mardi et travailler à diversifier les profils au sein de l’équipe COM.\n* Organisation technique :\n    Prévoir :\n    * une ressource dédiée au montage vidéo,\n    * une ressource dédiée à la régie (ProPresenter),\n    * une ressource dédiée au mélangeur.\n* Matériel :\n    Remplacer le câble HDMI ainsi que la télécommande de l’Ecodim.\n* Cohésion d’équipe :\n    Organiser des agapés ainsi que des temps de prière dédiés à la COM.\n* Budget :\n    Élaborer un budget dédié aux logiciels utilisés par la COM.\n\nCHECK-LIST DES ACTIONS À MENER\n\n* Former Anne Esther et Yannick à la baladeuse.\n* Revoir la répartition des tâches dès mardi.\n* Diversifier les profils au sein de l’équipe COM.\n* Remplacer le câble HDMI et la télécommande de l’Ecodim.\n* Publier les captions du séminaire (Sheryl et Manou).\n* Organiser des agapés et des temps de prière dédiés à la COM.\n* Établir un budget pour les logiciels COM (Responsable : Videm).\n* Séparer les responsabilités entre la régie, le mélangeur et le montage vidéo"}'::jsonb, NULL, NULL, '31Lvp2RcuKDiL5dU6c17', '2026-05-10T22:44:55.571Z', '2026-05-10T22:44:55.571Z'),
('7166ba3a-e56e-44ae-8d92-a8332c913b20', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', NULL, '2025-09-14', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', NULL, 'Inconnu (ancien système)', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI"},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK","audioReplayTime":"14:20"}}'::jsonb, NULL, NULL, '8DMNDJvL7dqTzZCyiwK3', '2025-09-14T10:18:34.631Z', '2025-09-14T10:18:34.631Z'),
('a8a3995d-696e-40c5-9f1c-32de87e16a64', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', 'd4743546-3b51-4757-8543-1df960277580', '2026-05-31', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI"},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK"}}'::jsonb, NULL, NULL, '8wGmTpObZGBdR2wDGDqP', '2026-06-14T00:57:40.628Z', '2026-06-14T00:57:40.628Z'),
('4c8f205f-d297-45eb-8692-7ac85db0ed5b', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', '98f70ece-b1aa-4638-b783-6ad10349d143', '2026-04-05', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"NOK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"PROBLEME","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI","proclamationLaunchNotes":"Problème de son. La sono ne recevait pas le signal","liveStreamingNotes":"Live en retard à cause du problème de son "},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"NON_EFFECTUEE","audioReplayPublication":"NOK","videoReplayPublication":"EN_COURS","fileArchiving":"OK","photoMaskingNotes":"En cours de sélection des photos ","audioReplayNotes":"En cours "},"generalObservations":"En globalité ça s’est bien passé. Mais toujours un décalage sur la caméra mobile au live de la synchronisation vidéo-son "}'::jsonb, NULL, 'Trépied pour iPhone pour faire du live mobile avec les iPhone et installer NDI sur les phones pour caster avec Gostream ou OBS', 'Bj1A7hFHezncSjuEkYfN', '2026-04-05T13:16:16.425Z', '2026-04-05T13:16:16.425Z'),
('37dc5471-8785-4621-9ed2-100204117bb0', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', '8cbf331e-f9bc-4c66-b908-a5c5fcf24239', '2026-03-01', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI","technicalProblems":"* ProPresenter a planté au moment des good news\n* Avoir le réflexe d’informer la gestion si une vidéo dure ou si on a un nouvel élément à la com"},"generalObservations":"L’audio n’était pas clean avec de l’écho au début mais cela a été réglée (audio en ligne)\n\nVidéo des consignes sanitaires à réviser avec la gestion pour le Dimanche prochain","afterService":{"videoReplayPublication":"OK","audioReplayNotes":"","fileArchivingNotes":"","fileArchiving":"OK","audioReplayPublication":"OK","servantsPhotos":"NON_EFFECTUEE","photoMasking":"EFFECTUEE","audioReplayTime":"14:01"}}'::jsonb, NULL, '* Booth de la com
* Formations
* Abonnements comptes partagés ', 'C9CNDfHU1DZERDfPDNYS', '2026-03-01T13:58:21.633Z', '2026-03-01T22:02:35.078Z'),
('4518a2d1-37cc-404c-bd23-73e0b2496b09', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', 'f7c81d0b-aef8-4ba7-8b51-d59b1ea5d1ef', '2026-07-12', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'vlCASZkbHlyZVpGApKMs', 'VIDEME MONTCHO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI","liveStreamingNotes":"-La baladeuse : Il y a eu des problèmes de communication avec la régie pour les plans;\nLourd à porter pour une membre, trouver un support si possible. \n\n-La régie : Propresenter dans l’affichage de versets a eu un soucis (Lorsqu’on met l’intervalle des versets ça saute certains compris dans l’intervalle ), problème de communication micro et concentration (entre affichage verset et plans).\n\n-Sono: Bonne réception des éléments de la Com et diffusions. \n\n"},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK"}}'::jsonb, NULL, '-Créa, Vidéo pour trouver des gens pour la régie, pour le design
-Harnet support le rig', 'EKYdUHKN0bjCGxrgfe8U', '2026-07-12T13:49:07.347Z', '2026-07-12T13:49:07.347Z'),
('596f3f35-2db4-4a15-ab06-2371c4ae2b02', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', 'd79bc7d8-65c0-446a-9d37-7a18010156af', '2026-06-07', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI"},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK"}}'::jsonb, NULL, NULL, 'KFsFBZsCx1bwRobpzYnd', '2026-06-14T00:57:12.367Z', '2026-06-14T00:57:12.367Z'),
('33e21354-e3ea-458a-84ea-adab74e08014', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', '3b3dde30-d30a-406b-8633-df3958922ef4', '2026-06-09', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI"},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK"}}'::jsonb, NULL, NULL, 'KsT2Am5GXA3qW8HvEBJf', '2026-06-14T00:56:56.911Z', '2026-06-14T00:56:56.911Z'),
('b7b6d80d-a203-4638-83e4-9724eb3187e2', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', '7e2d4cbd-b886-4ef5-bdea-4536135b5005', '2026-03-15', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"PROBLEME","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI","proclamationLaunchNotes":"1 min en retard"},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"NON_EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK","photoMaskingNotes":"En attente de validation des photos envoyés pour sélection "},"generalObservations":"Caméra mobile un peu difficile pour le moment. Mais en attente de la bonne caméra et en réflexion pour utiliser l’iPhone des photos pour la caméra mobile."}'::jsonb, NULL, 'RAS', 'Ndx6iz1RuAdYuVxeX51J', '2026-03-15T14:05:54.305Z', '2026-03-15T14:05:54.305Z'),
('1b867b80-e5fa-4519-9ee4-0a0075a0c373', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', '1518ce1a-d65e-49df-80a9-4efbfc9c4fee', '2026-04-26', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI","liveStreamingNotes":"","photoshootDetails":"Sur les plans de la baladeuse, par moment il y a des manques de timing sur le suivi des plans. \nIl faudrait redéployer la régie spéciale versets pour garder focus la régie vidéo. "},"afterService":{"servantsPhotos":"NON_EFFECTUEE","photoMasking":"NON_EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK","photoMaskingNotes":"Photos à valider d’abord","audioReplayNotes":""},"generalObservations":"1. Remettre la régie versets et un autre pour la régie vidéo.\nLe gestionnaire du mélangeur dit au gérant de la régie vidéo (propresenter) et aux cadreurs quoi afficher et quels plans faire. \n2. Prévoir un casque pour le cadreur baladeuse pour mieux répondre dans le talkie\n3. Quand on met le casque on ne sent pas l’écho du son en ligne. Mais il y a un écho sur le son en ligne. \n4. Enlever intro et outro des good news qui passent sur l’écran de ADN\n5. Dispositif de formation pour les formations de la com du Mardi\n6. Structure de formation enregistrée pour les porteurs de vie afin de ne pas répéter \n7. Faire toujours valider les créas par la gestion"}'::jsonb, NULL, '1. Casque talkie handless talkie
2. Ressources humaines ', 'PtvQ4PrhTeFT4RDVtd3h', '2026-04-26T13:59:35.575Z', '2026-04-26T13:59:35.575Z'),
('a2a0ec34-36d6-42eb-a678-f64aef454b28', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', 'ecabcabd-6ed3-4155-bac2-a33a668c579b', '2026-04-12', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI"},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK"}}'::jsonb, NULL, NULL, 'W0n6qHYUXpuhmNId6RXk', '2026-04-12T14:03:42.472Z', '2026-04-12T14:03:42.472Z'),
('3a59dca3-1388-45bc-a89d-aa2a54ae3c64', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', '17b7012d-384e-4a76-95a1-ec139d1eb85f', '2026-05-13', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI"},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK"}}'::jsonb, NULL, NULL, 'XnJRre4eVGDaLBYfrKuQ', '2026-06-07T14:49:41.237Z', '2026-06-07T14:49:41.237Z'),
('acd62d9b-0aa0-4713-ae56-6b93022a6d80', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', '1d2891de-e0ca-487d-a152-be003fba5733', '2026-03-08', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"PROBLEME","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI","proclamationLaunchNotes":"La gestion n''a pas donné le go à temps. \nLa com n''a pas demandé le go à temps","technicalProblems":"Cable de la batterie de la caméra qui était lâche : la caméra s''est éteinte par moment"},"afterService":{"servantsPhotos":"NON_EFFECTUEE","photoMasking":"EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK","photoMaskingNotes":"Photos en cours de sélection ","audioReplayTime":"13:30"},"generalObservations":"1. Batterie de la caméra ou ajustement à corriger pour éviter les problèmes de coupure de caméra\n2. Sensibiliser les serviteurs pour ne pas rester dans le champ de la caméra\n3. Formation avec respo ONESIME pour les lowerthirds des versets et cantiques\n4. Intégration auto des logos Culte C&C, RDV et autres..."}'::jsonb, NULL, 'Formations vidéos programmées
Formation créas programmées', 'ZI8k5WR6CXImJ7QgjIno', '2026-03-08T13:38:21.114Z', '2026-03-08T13:38:21.114Z'),
('2c2810f6-a92c-46af-a6ac-8ae70fcaa371', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', '429bdb1f-c9e5-4d5e-be10-655735c6ecda', '2026-06-28', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'vlCASZkbHlyZVpGApKMs', 'VIDEME MONTCHO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI","liveStreamingNotes":"Coupures de courant fréquentes aux 2 cultes\nProblème de mise en ligne au deuxième culte. Omission de lancer l’enregistrement à temps : juste la partie du message disponible. "},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"NON_EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK","photoMaskingNotes":"En cours","audioReplayNotes":"Seulement le premier culte est complet"},"generalObservations":"-Interrogations : sur l’éventualité de pouvoir séquencer les périodes filmées avec la baladeuse lorsque le caméraman est fatigué ou un problème : faisable seulement en cas d’urgence santé, batterie devant être rechargé pour culte suivant ou d’indisponibilité de membres \n\n=> les séquences avec la baladeuse nous aide à préparer notre passage en ligne (actuellement nous sommes en lien privé).\n\n-La forte pluie a mélangé l’organisation habituelle du programme. Il faudrait un groupe électrogène. \n\nEn dehors tout s’est bien déroulé, le son de la com était propre(Respo sono)\n\nLe teneur de la baladeuse était souffrant. \n\nOn est en sous effectif (régie): -Annonce recrutement à faire pour la com (créa et vidéo 9:16 et 16:9) pour vendredi soir ou samedi matin. \nTexte proposé : Vous avez un talent en design, graphiste, monteur vidéo, cadrage ou autre dans la communication ? Vous voulez le mettre au service du Seigneur ? Rejoignez le département de la Com de l’église Vases d’Honneur Assemblée Grâce Confondante. Pour tout info supplémentaire contactez le (numéro de AP TANO). Que Dieu vous bénisse, La Com. \n\n- Respo Videme n’était pas concentré au deuxième culte (lui-même)\n- Garder les photos du dimanche au moins une semaine. \n\n"}'::jsonb, NULL, '1. Annonce recrutement Com
2. Groupe Électrogène ', 'akXHxd3LVmRYot0ySzJM', '2026-06-28T15:02:12.512Z', '2026-06-28T15:02:12.512Z'),
('56741c34-4e87-42d3-bbef-ece14010a82e', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', 'a0c7937a-4c6d-4fd3-b2ce-c3b28daa3266', '2026-06-21', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI"},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK"}}'::jsonb, NULL, NULL, 'avaPHLeNuIuaZKt28jr4', '2026-06-21T14:18:33.538Z', '2026-06-21T14:18:33.538Z'),
('1e4e7a7c-dfe2-4bf8-a4cd-fca81b53510b', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', '235b3427-92c9-4466-8553-dd5fdd56699e', '2026-05-31', '2119068d-be39-44ff-aaac-1a116975de04', '2e Culte de Célébration & Contemplation', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI"},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK"}}'::jsonb, NULL, NULL, 'cBB6tcc20mKKmZw6EOwy', '2026-06-14T00:58:19.313Z', '2026-06-14T00:58:19.313Z'),
('bce8b377-9bc7-4775-adb3-c434a30c33b4', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', '734ec6db-2ed1-4505-adad-9797dbd97b8a', '2026-05-12', '2ce42945-3831-4ef6-982b-3891589cbd2d', 'Mardi du Mariage', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI"},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK"}}'::jsonb, NULL, NULL, 'ncVofBgDnenaUBFTpL3g', '2026-06-07T14:49:09.391Z', '2026-06-07T14:49:09.391Z'),
('a7d83349-ad28-4139-b4ab-61f4d6015231', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', '42cc37f8-d413-492c-baa3-8a40c0caa5bc', '2026-03-29', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI"},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK"}}'::jsonb, NULL, NULL, 'rM7mKeAEUpfUgnZwajHD', '2026-03-29T13:45:41.296Z', '2026-03-29T13:45:41.296Z'),
('a3937fea-683c-48da-b43c-30e28298e969', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', '296de74c-65e0-4cd6-bd1f-d23158dacc7b', '2026-06-07', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI"},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK"}}'::jsonb, NULL, NULL, 'rhmxsjqLEnTFMKueef01', '2026-06-14T00:57:24.419Z', '2026-06-14T00:57:24.419Z'),
('97121c43-70ac-4e11-aa25-88be33143311', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', 'af91fbc8-65ce-456e-97f5-77b8229e3b69', '2026-06-10', '1fc461cb-50b7-4f2e-92db-b77f863ab11b', 'Rendez-Vous des Champions', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI"},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK"}}'::jsonb, NULL, NULL, 'tcUjQLBuUtjnp2b3ilzr', '2026-06-14T00:55:43.214Z', '2026-06-14T00:55:43.214Z'),
('69f4fc56-b02d-476a-b988-87615324c501', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', 'c5f8d3c5-b9b8-42fd-8d22-171f3178e2cb', '2026-06-21', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"BONNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI"},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"EFFECTUEE","audioReplayPublication":"OK","videoReplayPublication":"OK","fileArchiving":"OK"}}'::jsonb, NULL, NULL, 'wI5763avPFQNSaHLuhHA', '2026-06-21T14:16:52.215Z', '2026-06-21T14:16:52.215Z'),
('2daed7eb-43fd-44d5-ad94-0ea2944f3d64', 'bergerie', 'sono', 'QpFTn6behEIrHByDMCPP', 'SONORISATION', '54896d20-094d-4a65-bf37-cd56cdfe7b98', '2026-04-12', '342b0930-8c28-4fa2-9674-91290df2bf45', '1er Culte de Célébration & Contemplation', 'Xwcy3L2rhYEtjBSFFgWn', 'AP PATRICE TANO', '{"beforeService":{"materialCheck":"OK","soundQualityTest":"OK","liveStreamingTest":"OK","onlineSoundTest":"OK","onlineVideoTest":"OK","photoEquipmentPrep":"OK"},"duringService":{"proclamationLaunch":"OK","roomSoundQuality":"SATISFAISANT","liveStreaming":"OUI","onlineSoundQuality":"MOYENNE","onlineVideoQuality":"BONNE","photoshootDuringService":"OUI"},"afterService":{"servantsPhotos":"EFFECTUEE","photoMasking":"NON_EFFECTUEE","audioReplayPublication":"NOK","videoReplayPublication":"EN_COURS","fileArchiving":"OK"}}'::jsonb, NULL, NULL, 'xi3DGmxLyIjMjTDImGKr', '2026-04-12T14:01:50.383Z', '2026-04-12T14:01:50.383Z'),
('a451711d-a07b-42c9-8331-93650c03dda8', 'bergerie', 'academie', '9TOZo9Ba2W2vU4NLTugd', 'ACADEMIE D''HONNEUR', '98f70ece-b1aa-4638-b783-6ad10349d143', '2026-04-05', NULL, NULL, NULL, 'Inconnu (ancien système)', '{"className":"METANOÏA","actualStudents":0,"presentStudents":0,"moderator":"Aucun","courseOfTheDay":"Pas de cours à cause de la Pâque ","spiritualAtmosphere":"","classParticipation":"","nextCourse":"Devoir Numéro 3","nextModerator":"ASSOMA JOCELYNE ","nextMeditation":"","nextExercise":""}'::jsonb, NULL, NULL, '2xdthLlRdxCSMBFknoxk', '2026-04-05T12:59:28.884Z', '2026-06-14T00:37:14.972Z'),
('28eb44f8-3117-4284-abfa-69053e7ea293', 'bergerie', 'academie', '9TOZo9Ba2W2vU4NLTugd', 'ACADEMIE D''HONNEUR', '42cc37f8-d413-492c-baa3-8a40c0caa5bc', '2026-03-29', NULL, NULL, NULL, 'Inconnu (ancien système)', '{"className":"METANOÏA ","actualStudents":16,"presentStudents":12,"moderator":"ASSOMA Jocelyne ","courseOfTheDay":"L’Évangélisation (révision)","spiritualAtmosphere":"Bonne","classParticipation":"Bonne","nextModerator":"ASSOMA Jocelyne ","nextMeditation":"Romains 7 à 9","nextExercise":"RAS","nextCourse":"Révision (Pas de cours)"}'::jsonb, NULL, NULL, 'CQCFHZ0i4pL5gizZ6gsm', '2026-03-29T13:40:22.272Z', '2026-06-14T00:37:15.119Z'),
('279b5ed1-11c0-4149-8946-385014219781', 'bergerie', 'academie', '9TOZo9Ba2W2vU4NLTugd', 'ACADEMIE D''HONNEUR', 'c9112034-d43b-4ec9-af14-f2f1612bf466', '2026-05-10', NULL, NULL, 'n6TnUr5W7oOmNhEGus3J', 'FRED KPEYA', '{"className":"METANOÏA ","actualStudents":16,"presentStudents":0,"moderator":"AP SERY","courseOfTheDay":"Pas de cours aujourd’hui. Les étudiants rédigent leur rapport d’exposés. ","spiritualAtmosphere":"","classParticipation":"","nextCourse":"","nextModerator":"","nextMeditation":"","nextExercise":""}'::jsonb, NULL, NULL, 'EEbSw6GmmA5mS6yxAm9p', '2026-05-10T13:52:19.581Z', '2026-05-10T13:52:19.581Z'),
('cbd9a80d-2b69-4feb-9ebc-1dd38bdde1da', 'bergerie', 'academie', '9TOZo9Ba2W2vU4NLTugd', 'ACADEMIE D''HONNEUR', '7e1023bd-0964-41a3-8f28-869588fe227c', '2026-06-14', NULL, NULL, 'BwBtFuIsuCy5SOerjk8x', 'AP SERY CHRISTIAN', '{"className":"METANOÏA ","actualStudents":16,"presentStudents":12,"moderator":"AP SERY","courseOfTheDay":"Fin de la session avec remise des bulletins. ","spiritualAtmosphere":"","classParticipation":"","nextCourse":"","nextModerator":"","nextMeditation":"","nextExercise":""}'::jsonb, NULL, 'Kit des cours classe à 2 et classe 3 à demander à Pasteur Soppi par courrier (action du pasteur résident). ', 'Gq2s6SOhBfabHVuL8SoW', '2026-06-14T14:07:02.361Z', '2026-06-14T14:07:02.361Z'),
('ad3c4f0a-f161-4ec3-8134-ba1b044393fd', 'bergerie', 'academie', '9TOZo9Ba2W2vU4NLTugd', 'ACADEMIE D''HONNEUR', '1d2891de-e0ca-487d-a152-be003fba5733', '2026-03-08', NULL, NULL, NULL, 'Inconnu (ancien système)', '{"className":"METANOÏA ","actualStudents":16,"presentStudents":10,"moderator":"Mme TUEHI ","courseOfTheDay":"LA BIBLE (Partie 1)","nextModerator":"Mme TUEHI ","nextCourse":"LA BIBLE (Partie 2)","nextMeditation":"Actes 26 à 28","nextExercise":"Classer  les 66 différents livres de la Bible.","classParticipation":"Bonne participation. ","spiritualAtmosphere":"Bonne atmosphère. "}'::jsonb, NULL, NULL, 'LkKD17KTflph5ds3ASMe', '2026-03-08T13:30:30.293Z', '2026-06-14T00:37:15.257Z'),
('e2328378-a7ea-480f-ad14-e4fcddd69fb7', 'bergerie', 'academie', '9TOZo9Ba2W2vU4NLTugd', 'ACADEMIE D''HONNEUR', 'd08709ed-5bc8-49e7-ac85-700d42926ecc', '2026-03-12', NULL, NULL, NULL, 'Inconnu (ancien système)', '{"className":"METANOÏA ","actualStudents":16,"presentStudents":12,"moderator":"Mme TUEHI ","courseOfTheDay":"LA BIBLE (dernière partie)","spiritualAtmosphere":"Bonne","classParticipation":"Bonne","nextCourse":"L’Evangélisation","nextModerator":"ASSOMA Jocelyne ","nextMeditation":"Romains 1 à 3","nextExercise":""}'::jsonb, NULL, NULL, 'RSSR3tMDzzLM9Qq6uvEX', '2026-03-15T13:25:01.016Z', '2026-06-14T00:37:15.398Z'),
('84ac2e97-24b9-4f6c-a893-630362c35aa1', 'bergerie', 'academie', '9TOZo9Ba2W2vU4NLTugd', 'ACADEMIE D''HONNEUR', '6968898e-a9de-48f6-84c1-b9939442f7fb', '2026-02-22', NULL, NULL, NULL, 'Inconnu (ancien système)', '{"className":"METANOÏA","presentStudents":11,"moderator":"ASSOMA JOCELYNE","courseOfTheDay":"LA TRINITE","spiritualAtmosphere":"Lourdeur","classParticipation":"Bonne","nextCourse":"LA TRINITE","nextModerator":"ASSOMA JOCELYNE","nextMeditation":"ACTES 20 à 22","nextExercise":"RAS","actualStudents":16}'::jsonb, NULL, NULL, 'VqxVJX5glRYwhoLUTcWj', '2026-02-22T13:58:45.509Z', '2026-06-14T00:37:15.539Z'),
('eefe4d6a-b27d-4959-a049-36f62568f8d1', 'bergerie', 'academie', '9TOZo9Ba2W2vU4NLTugd', 'ACADEMIE D''HONNEUR', '7fa9e005-6a0e-4ab9-a2b1-c05f89b86258', '2026-05-24', NULL, NULL, 'n6TnUr5W7oOmNhEGus3J', 'FRED KPEYA', '{"className":"METANOÏA","actualStudents":15,"presentStudents":0,"moderator":"AP SERY","courseOfTheDay":"Aucun cours (Remise des rapports des exposés)","spiritualAtmosphere":"RAS","classParticipation":"RAS","nextCourse":"Présentation des exposés le 7 juin 2026","nextModerator":"","nextMeditation":"","nextExercise":""}'::jsonb, NULL, NULL, 'X1sqGqP55aMYlaozkYHc', '2026-05-24T14:46:07.411Z', '2026-05-24T14:46:07.411Z'),
('dfb94449-e49a-4532-93b0-306a1c51f0a9', 'bergerie', 'academie', '9TOZo9Ba2W2vU4NLTugd', 'ACADEMIE D''HONNEUR', '8cbf331e-f9bc-4c66-b908-a5c5fcf24239', '2026-03-01', NULL, NULL, NULL, 'Inconnu (ancien système)', '{"className":"METANOÏA ","actualStudents":16,"presentStudents":10,"moderator":"Assoma Jocelyne ","courseOfTheDay":"La trinité ","spiritualAtmosphere":"Bonne atmosphère ","classParticipation":"Bonne participation. ","nextCourse":"La Bible","nextModerator":"Mme Tuehi","nextMeditation":"Actes 23 à 25","nextExercise":"RAS"}'::jsonb, NULL, NULL, 'dXKrvp9vBZ201o6I73oF', '2026-03-01T14:10:50.735Z', '2026-06-14T00:37:15.677Z'),
('396cade2-4198-4455-98c4-179c077e5b7b', 'bergerie', 'academie', '9TOZo9Ba2W2vU4NLTugd', 'ACADEMIE D''HONNEUR', '2d38d1c5-8668-4771-9f0c-e3b992937e9f', '2026-04-26', NULL, NULL, NULL, 'Inconnu (ancien système)', '{"className":"METANOÏA ","presentStudents":2,"moderator":"AP Christian ","courseOfTheDay":"Rattrapage devoir 2 et 3","spiritualAtmosphere":"RAS","classParticipation":"RAS","nextCourse":"Correction devoir et consignes exposés","nextModerator":"AP Christian","nextMeditation":"","nextExercise":"","actualStudents":16}'::jsonb, NULL, NULL, 'juEUjjdP79w9mEjDbWXj', '2026-04-26T14:16:50.028Z', '2026-06-14T00:37:15.816Z'),
('c285a0e4-7c65-4015-a2f5-2b19db76dee3', 'bergerie', 'academie', '9TOZo9Ba2W2vU4NLTugd', 'ACADEMIE D''HONNEUR', 'ecabcabd-6ed3-4155-bac2-a33a668c579b', '2026-04-12', NULL, NULL, NULL, 'Inconnu (ancien système)', '{"className":"METANOÏA","actualStudents":16,"presentStudents":8,"moderator":"ASSOMA JOCELYNE","courseOfTheDay":"Devoir numéro 3","spiritualAtmosphere":"bonne","classParticipation":"bonne","nextCourse":"Rattrapage devoir ","nextModerator":"ASSOMA JOCELYNE","nextMeditation":"","nextExercise":""}'::jsonb, NULL, NULL, 'ppHknnDWpRPwlVLDYSlj', '2026-04-12T14:06:50.014Z', '2026-06-14T00:37:15.953Z'),
('40ba2d98-a587-4dd2-9911-f98cc76f0079', 'bergerie', 'academie', '9TOZo9Ba2W2vU4NLTugd', 'ACADEMIE D''HONNEUR', 'f5f2c26a-036f-4748-a266-4d5ce4186c8a', '2026-03-22', NULL, NULL, NULL, 'Inconnu (ancien système)', '{"className":"METANOÏA","actualStudents":16,"moderator":"ASSOMA Jocelyne ","courseOfTheDay":"L’Évangélisation","spiritualAtmosphere":"Bonne atmosphère. ","classParticipation":"Bonne participation ","nextCourse":"Évangélisation et révisions ","nextModerator":"ASSOMA Jocelyne ","nextMeditation":"Romains 4 à 6","nextExercise":"RAS","presentStudents":12}'::jsonb, NULL, NULL, 'qRai188BAhHEsuiNSa0F', '2026-03-22T13:34:41.928Z', '2026-06-14T00:37:16.237Z'),
('fb8eaf17-bf14-4536-8caf-797518c18842', 'bergerie', 'academie', '9TOZo9Ba2W2vU4NLTugd', 'ACADEMIE D''HONNEUR', '8ab6559b-92c2-4f93-b5db-3a818cd9d43f', '2026-05-03', NULL, NULL, 'n6TnUr5W7oOmNhEGus3J', 'FRED KPEYA', '{"className":"METANOÏA","actualStudents":16,"presentStudents":9,"moderator":"AP SERY","courseOfTheDay":"Correction devoir 3 et consignes pour les exposés ","spiritualAtmosphere":"RAS","classParticipation":"Bonne","nextCourse":"Présentation des exposés ","nextModerator":"AP SERY","nextMeditation":"","nextExercise":"RAS"}'::jsonb, NULL, NULL, 'wMmT2oCuipsEPzDvvMwH', '2026-05-03T15:30:46.954Z', '2026-05-03T15:30:46.954Z')
ON CONFLICT (church_id, report_type, legacy_firestore_id) DO NOTHING;

-- Besoins signales --
INSERT INTO culte_report_needs (id, church_id, culte_report_id, department_name, description, priority, is_addressed, addressed_by, addressed_at, legacy_firestore_id, created_at) VALUES
('93abe086-cd76-4d9a-9906-9e70995f05f3', 'bergerie', '3c49441a-d89e-421d-aff9-050b28993da6', 'Sainte Cène', 'Rien à signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:28:02.039Z', '1i5OhydlXdh2nDrcNNa1', '2026-05-10T14:37:52.102Z'),
('7d3bd45c-ccbe-40d8-9429-80d138e2f009', 'bergerie', 'd221cdad-7bfa-450f-918c-a9aa5a829e4c', 'Gestion de Culte', '-Prévoir d’acheter des parapluies pour l’église : Tata Blanche', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:29:50.071Z', '32NrUqkQvmUfkpvkhsro', '2025-10-29T08:46:46.623Z'),
('2483d7d2-90dd-494d-9b05-96d7589fe4ad', 'bergerie', '4793a422-9983-4bf7-9874-09441fb64fb0', 'ADN - Amis des Nouveaux', 'Code Qr sur une carte', 'medium', false, NULL, NULL, '4V6NNNN1LlRsCOvhPdzL', '2026-05-31T13:24:00.430Z'),
('83a6e61b-ffab-41f0-a4c7-bea770b57170', 'bergerie', '1238c2e7-831f-43c3-b771-229d988d70fa', 'Sainte Cène', 'Rien à signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:26:01.160Z', '5HWbFEJ1plUZ7A7bpaIl', '2026-05-26T05:56:17.842Z'),
('fb8c054e-e7dc-4820-b926-4de30ad57f4e', 'bergerie', '9429677b-be0d-4874-9b46-6b0d9b8857cb', 'Sainte Cène', '2 boîte de gant', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:28:21.210Z', '8jMEnNXKga3zc1QHc58H', '2026-03-08T14:25:55.688Z'),
('cd617682-c708-4f56-b7d9-0886dde3eb6d', 'bergerie', '5f8df71a-b0da-446c-8b19-f36a14484cc5', 'Gestion de Culte', '-Les fiches de recensement des âmes qui donnent leurs vies à Jésus sont finies : besoin à remonter à tata Blanche pour récupérer au siège', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:25:27.749Z', '9raPuQBdAeKGXk1U7ZC6', '2025-10-22T16:23:59.829Z'),
('cd444ca7-05b5-43e4-bc51-124158fa1276', 'bergerie', '32b8552b-8bb2-458c-abc0-e890630e7c84', 'Sainte Cène', 'Rien à signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:26:08.465Z', 'AMNByM1Jv5yM8vFOzs5j', '2026-05-24T11:32:43.112Z'),
('3055152b-0d1e-4560-939a-f4e99ddfa0eb', 'bergerie', NULL, 'Sainte Cène', 'RAS', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:28:31.748Z', 'Bid3TCyrgFw7lJSB2oZE', '2026-02-23T19:57:54.412Z'),
('5c19aa2c-af90-4d74-92fc-65f970094eb0', 'bergerie', '5f8df71a-b0da-446c-8b19-f36a14484cc5', 'Gestion de Culte', '-Prévoir d’acheter des parapluies pour l’église', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:25:36.389Z', 'DZuB8MzRYU5KooeCySu4', '2025-10-22T16:24:00.009Z'),
('6a308dc9-9d71-4bc4-a775-fbf59141448a', 'bergerie', 'b7b6d80d-a203-4638-83e4-9724eb3187e2', 'Communication & Sono', 'RAS', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:39:55.543Z', 'DbFlxfZWggA9LYIifIeC', '2026-03-15T14:05:54.527Z'),
('3410360a-ce80-463e-bb99-67e3039516ca', 'bergerie', 'f2e596fc-70b7-4cab-b152-6923422b8c6a', 'Sainte Cène', 'Comprimés de stérilisation', 'medium', false, NULL, NULL, 'GCRljoP7OTFrAQmufHFM', '2026-06-28T14:52:51.826Z'),
('f3abac9f-0a4d-44f1-bf46-8f95fdcc2c16', 'bergerie', '4c8f205f-d297-45eb-8692-7ac85db0ed5b', 'Communication & Sono', 'Trépied pour iPhone pour faire du live mobile avec les iPhone et installer NDI sur les phones pour caster avec Gostream ou OBS', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:39:50.576Z', 'HJmJaGkCaodMBRNYWpSh', '2026-04-05T13:16:16.664Z'),
('b8fd948a-3875-45c2-8582-bb612ee57e7f', 'bergerie', '1caf534f-c859-46ed-8dbf-eb72e148bf4b', 'Sainte Cène', 'Rien à signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:28:46.267Z', 'IVC8HuBisinR1dHgtn3S', '2026-04-12T13:09:28.465Z'),
('3a14a3df-5afb-4847-b892-e96f22da3945', 'bergerie', 'bdd8da67-eb72-46f6-bcba-1615164f3205', 'Sainte Cène', 'Pains de Sainte Cène', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:27:52.724Z', 'IVIOIWjwfSes0RzwvBkH', '2026-03-22T13:36:36.136Z'),
('cba53a87-d32e-430f-af9d-924219c1b989', 'bergerie', 'e30b8dc7-b441-4b04-9174-73f2876d7148', 'Sainte Cène', 'Rien a signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:26:35.001Z', 'J7jRYqiS7tfQqviiuecf', '2026-04-26T13:38:08.253Z'),
('6aa60080-e913-494b-8539-ef3c27f79781', 'bergerie', '0a9ed798-84e5-49f3-9bb4-3d0fc3ebd720', 'Sainte Cène', 'Rien à signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:28:05.499Z', 'KVz4NIrt5kZ9XB5GXMh6', '2026-05-10T13:53:03.575Z'),
('684f1c1a-842e-4100-97db-c7a861af8d85', 'bergerie', 'a79deba5-3714-42d7-a6f8-7eac4cf059f7', 'Sainte Cène', 'Rien à signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:28:10.965Z', 'KyVPaqhFhlIvaZUxCo7f', '2026-05-17T15:01:44.840Z'),
('7ee888c1-fdf9-4b88-8c3b-ea779d5e0a91', 'bergerie', '9429677b-be0d-4874-9b46-6b0d9b8857cb', 'Sainte Cène', '2 Papier alu', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:28:27.248Z', 'MYeBZKAkQ3KEXeNWhbFX', '2026-03-08T14:25:55.119Z'),
('39caf3c3-0dde-4fc5-ae7a-bd0710420a34', 'bergerie', 'f2519218-fcc2-4122-b958-56dd52ba6df0', 'Sainte Cène', 'Rien à signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:26:59.871Z', 'Mu0EwHikRr3cwuWuEFfK', '2026-04-12T14:14:40.774Z'),
('6a910a04-a6b5-4d7d-b171-60624f33bd7f', 'bergerie', 'f5f2c26a-036f-4748-a266-4d5ce4186c8a', 'Gestion de Culte', '- Souci avec le micro du dirigeant à la sainte cène', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:29:55.074Z', 'NjOU5Kb69sODFfkVVhDq', '2026-03-22T13:09:48.454Z'),
('7a862388-5a1f-4329-b91d-1eb7e286118d', 'bergerie', 'acd62d9b-0aa0-4713-ae56-6b93022a6d80', 'Communication & Sono', 'Formation créas programmées', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T11:58:23.003Z', 'O6jFCzikSDytbjYY38HN', '2026-03-08T13:38:21.489Z'),
('e7eabb5b-143e-4a7a-bf6e-2cbd5a184ad5', 'bergerie', '4793a422-9983-4bf7-9874-09441fb64fb0', 'ADN - Amis des Nouveaux', 'Support d''information de l''église', 'medium', false, NULL, NULL, 'OBuoUbaPctzBKcOv91uD', '2026-05-31T13:24:00.173Z'),
('32bfd4cc-64af-4c64-a57b-0f8cbc4e4eb3', 'bergerie', '5db259e3-f311-43f7-ae95-1f1f349ce4be', 'Gestion de Culte', '-Enveloppes 931 à pourvoir : Videme. M.', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:25:08.824Z', 'QWe5UgL724mQGWjVZkME', '2025-10-22T16:31:43.531Z'),
('04f7937e-df04-4e35-b368-2682655399b7', 'bergerie', '05817b39-070a-419b-b823-c4007693dda9', 'Sainte Cène', 'Rien', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:28:50.154Z', 'RkxBW5GcklP2k22N07PC', '2026-04-05T13:08:18.598Z'),
('0210a30b-7f35-4581-9f4d-4493ddc7d2e3', 'bergerie', '0ece44af-54aa-4f43-8535-d8413d9ad9b2', 'Sainte Cène', 'Rien ne manque', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:27:19.588Z', 'RtYr4Qaip46ADYavJSZM', '2026-03-30T06:45:33.232Z'),
('cf760842-7a27-42ab-9c73-17d5d24943af', 'bergerie', '3db57627-0df3-4fa7-b2fd-c9f34931280c', 'Sainte Cène', 'Papier aluminium, gant, cache nez', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:27:42.464Z', 'SPde2ChG0Vo36BFDecSX', '2026-03-22T13:39:43.835Z'),
('0980ef8a-06d0-4540-a8cc-712c7dd93d2a', 'bergerie', '2c2810f6-a92c-46af-a6ac-8ae70fcaa371', 'Communication & Sono', '1. Annonce recrutement Com', 'medium', false, NULL, NULL, 'WxczKroIiT34bWGuiQGi', '2026-06-28T15:02:12.873Z'),
('b7141c90-4fcf-4ff2-93cf-3e2541986d68', 'bergerie', 'f5f2c26a-036f-4748-a266-4d5ce4186c8a', 'Gestion de Culte', '- Débordement de 15min', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:24:03.095Z', 'XY8cSFMSLviwvjq6F8mv', '2026-03-22T13:09:48.682Z'),
('a97d9385-a5cc-46d6-a4f8-6d8128022899', 'bergerie', 'b2ae2888-ae6e-4bf4-ba62-575f21f677d5', 'Sainte Cène', 'Rien à signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:26:51.073Z', 'YQpWx8AlaphlhzLNSclg', '2026-04-24T08:49:16.582Z'),
('11abb367-9683-4b32-bdb2-3f12f5bcdbcf', 'bergerie', '7e772291-f258-4783-b47f-f54528319195', 'Sainte Cène', 'Rien à signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:26:27.883Z', 'ZqhsjHcrZhI3T3GIVAMG', '2026-04-26T17:25:51.160Z'),
('527fe2b3-865a-4739-9663-d2a33c0396e8', 'bergerie', '4518a2d1-37cc-404c-bd23-73e0b2496b09', 'Communication & Sono', '-Créa, Vidéo pour trouver des gens pour la régie, pour le design', 'medium', false, NULL, NULL, 'bHHJKs7bsMK8fz9EWfAI', '2026-07-12T13:49:07.615Z'),
('96baf6d6-8813-40b6-af29-32f0949c14c2', 'bergerie', 'd221cdad-7bfa-450f-918c-a9aa5a829e4c', 'Gestion de Culte', '-Les fiches de recensement des âmes qui donnent leurs vies à Jésus sont finies : besoin à remonter à tata Blanche pour récupérer au siège', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:24:57.905Z', 'bfKDyhkFqTUiLw9On0jn', '2025-10-29T08:46:46.384Z'),
('b47a051d-0fc9-4e4e-8c5f-0e72b1f5ad82', 'bergerie', '79d17cf6-2152-41ae-babc-a92224fde5e0', 'Sainte Cène', 'Rien  à  signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:28:42.211Z', 'blgrmnx7xLpXORbMOyea', '2026-04-24T08:45:24.452Z'),
('479bb281-11d6-4bf7-8135-2aad7b70623e', 'bergerie', 'caea9a87-006e-4608-9a4a-98849dbed280', 'Sainte Cène', 'Rien à signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:26:19.565Z', 'd0PS6xW1ASjQ8SdKkq7k', '2026-05-07T19:44:28.262Z'),
('02c11d56-ec5a-4033-ba4d-4ffc5507b8d8', 'bergerie', '9a25de40-abeb-4e56-a90e-e078ca646eee', 'Finance', 'ENVELOPPES DIMES', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:29:21.706Z', 'd6Cwu7Mqb99NYK3beB5R', '2025-11-13T15:51:35.748Z'),
('fd1e91b9-6dcb-41f0-9763-54fdbb3aab92', 'bergerie', 'ddc9df68-907b-40b3-9086-a5cc136344bb', 'Sainte Cène', 'Rien à signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-11T12:33:22.498Z', 'e2Ox4ykxtJtZuJI5HjMR', '2026-06-07T14:03:56.224Z'),
('87447763-2728-4c8b-ad92-5f45f9c56344', 'bergerie', '4793a422-9983-4bf7-9874-09441fb64fb0', 'ADN - Amis des Nouveaux', 'Code Qr sur une carte', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T11:58:31.770Z', 'evruGMINXhZC16Phqrni', '2026-05-31T13:23:59.915Z'),
('34885170-c297-4467-b5ab-1ad3826c4b79', 'bergerie', 'abc6d6ae-1c71-46ec-8482-d340a763a391', 'Sainte Cène', 'Rien à signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:26:23.376Z', 'go36B6QSr3GJRzZBEKey', '2026-05-07T19:42:53.013Z'),
('6a2ebc2b-055a-4bc6-9cd6-9d33f8f3c993', 'bergerie', 'f5f2c26a-036f-4748-a266-4d5ce4186c8a', 'Gestion de Culte', '-Son fort pendant les Good News', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:24:33.904Z', 'hTEQUOSB429Tx9PxdcMg', '2026-03-22T13:09:48.215Z'),
('97012caa-7988-4a6c-a716-d218a5480593', 'bergerie', 'cbd9a80d-2b69-4feb-9ebc-1dd38bdde1da', 'Académie', 'Kit des cours classe à 2 et classe 3 à demander à Pasteur Soppi par courrier (action du pasteur résident).', 'medium', false, NULL, NULL, 'hXz3AQ47x2s0BiwRqp0N', '2026-06-14T14:07:04.716Z'),
('f66ec428-6894-4ac1-812c-ee6a4d675d52', 'bergerie', '91089556-2a7a-431d-99d7-ade688c1a1ac', 'Sainte Cène', 'Rien à signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T11:57:55.523Z', 'k4D5oGLFhi4y87B6GNhR', '2026-06-02T06:55:31.464Z'),
('8cdd7a56-7d94-4a2f-ab14-ffc828e8c456', 'bergerie', NULL, 'Gestion de Culte', '-Son fort pendant les Good News', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:23:38.533Z', 'lk83AlEvkymhoVnOzPYq', '2026-03-22T13:09:53.168Z'),
('f240fe84-fc51-427e-a95a-30e4dacce9c6', 'bergerie', '4793a422-9983-4bf7-9874-09441fb64fb0', 'ADN - Amis des Nouveaux', 'Support d''information de l''église', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T11:58:36.653Z', 'ntnhkXqpHbhLV4nTmnCd', '2026-05-31T13:23:59.684Z'),
('e030d1fd-7079-4c3b-b01f-bdee97a32dca', 'bergerie', '4518a2d1-37cc-404c-bd23-73e0b2496b09', 'Communication & Sono', '-Harnet support le rig', 'medium', false, NULL, NULL, 'qnmg7IMFlTeqlWESI9Bc', '2026-07-12T13:49:07.864Z'),
('77b6766b-1b4e-456d-b38b-584eac42d3d5', 'bergerie', '5db259e3-f311-43f7-ae95-1f1f349ce4be', 'Gestion de Culte', '-Prévoir d’acheter des parapluies pour l’église : Tata Blanche', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:29:46.590Z', 'rnBWeld0drsCScCuzOaA', '2025-10-22T16:31:43.366Z'),
('dc0137be-671a-4cca-ad10-da2d0188a6eb', 'bergerie', 'ca82af8d-795c-4f49-bb66-2b9bba98c2d3', 'Sainte Cène', 'Papier allu', 'medium', false, NULL, NULL, 'sTwz47pC3IOt3CQox3g8', '2026-06-14T14:10:46.084Z'),
('ae4e86ac-addf-4146-b6c1-55a5fc038131', 'bergerie', '91042592-b062-43ad-8ef1-26b1d3d8ec1e', 'Gestion de Culte', 'ENVELOPPE DE DIMES', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:24:45.552Z', 'simdivfuyIRzyQflOiA2', '2025-11-13T16:00:56.832Z'),
('767a9d5f-077b-46b2-a4dc-b7d8cb6b4777', 'bergerie', '2c2810f6-a92c-46af-a6ac-8ae70fcaa371', 'Communication & Sono', '2. Groupe Électrogène', 'medium', true, 'Inconnu (ancien système)', '2026-06-28T19:37:07.549Z', 'txoPjXeCVkdvHZCoYpJk', '2026-06-28T15:02:13.233Z'),
('468b16f2-4b74-44ff-8ea5-cfa93ed682e2', 'bergerie', '1b867b80-e5fa-4519-9ee4-0a0075a0c373', 'Communication & Sono', '1. Casque talkie handless talkie', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:22:42.688Z', 'uKt2L0lhsHVrUeQHBXCN', '2026-04-26T13:59:35.770Z'),
('46c4fba5-f638-45a6-bd0f-fd2312ece837', 'bergerie', 'acd62d9b-0aa0-4713-ae56-6b93022a6d80', 'Communication & Sono', 'Formations vidéos programmées', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:24:19.773Z', 'ulk5ytvxQ1s4uhId944p', '2026-03-08T13:38:21.305Z'),
('9d25261b-77b2-4d7d-a432-0ba720765362', 'bergerie', 'de51f66a-150f-4caf-ba48-e0ff8c8b8894', 'Sainte Cène', 'Milton comprimés de stérilisation', 'medium', false, NULL, NULL, 'viumKfyMmGhzT2PDbair', '2026-06-28T13:50:32.610Z'),
('db7d17e0-798a-46cb-bda7-4e280a08df7a', 'bergerie', '91906280-b50a-43e3-b09f-8e6e9987e593', 'Sainte Cène', 'Rien à signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T11:57:59.059Z', 'wFh7rVZINTxoZHYa4Jnt', '2026-06-02T06:54:18.076Z'),
('325307d1-d886-45ea-88e0-ca91910e86af', 'bergerie', '1b867b80-e5fa-4519-9ee4-0a0075a0c373', 'Communication & Sono', '2. Ressources humaines', 'medium', false, NULL, NULL, 'wM6w69ZnR4KgB31s11mh', '2026-04-26T13:59:35.941Z'),
('b530cc5e-58e8-4db7-a048-5a92d642e312', 'bergerie', '34984b05-b434-4f54-8ee8-3c6bc55f82b7', 'Sainte Cène', 'Rien à signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-11T12:33:18.650Z', 'wsSkv2VMs5J14D4gzNNY', '2026-06-07T14:04:41.562Z'),
('1c5e6591-5e98-41a8-b750-b7516b61708b', 'bergerie', 'a64f3ab4-1dcf-4e8e-a16a-9dc31752b6d2', 'Sainte Cène', 'Rien à signaler', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:26:14.218Z', 'xJjSV8kRqHpBBCMDhKhZ', '2026-05-17T15:03:25.312Z'),
('fd8830eb-bbe9-4a50-b3ad-560b955432b9', 'bergerie', NULL, 'Gestion de Culte', '- Souci avec le micro du dirigeant à la sainte cène', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:23:54.096Z', 'yKLbqHp1kQ8bhMsEWNmb', '2026-03-22T13:09:53.518Z'),
('e806f25c-d500-4ec0-8917-c651b7ffcacc', 'bergerie', NULL, 'Gestion de Culte', '- Débordement de 15min', 'medium', true, 'Inconnu (ancien système)', '2026-06-02T05:23:06.956Z', 'zGeS3oMLSINNAzBsCgHc', '2026-03-22T13:09:53.697Z')
ON CONFLICT DO NOTHING;
