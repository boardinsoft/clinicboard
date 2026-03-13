export const FIELD_SUGGESTION_MAP: Record<string, Record<string, string[]>> = {
    personalHistory: {
        nutrition: [
            'Diabetes Mellitus Tipo 2', 'Hipertensión Arterial', 'Obesidad', 'Dislipidemia', 'Resistencia a la insulina',
            'Síndrome Metabólico', 'Hipotiroidismo', 'Hipertiroidismo', 'Enfermedad Celíaca', 'Intolerancia a la lactosa',
            'Intolerancia al gluten', 'Síndrome de Ovario Poliquístico (SOP)', 'Reflujo Gastroesofágico', 'Gastritis crónica',
            'Hígado graso no alcohólico (EHGNA)', 'Enfermedad Renal Crónica', 'Colelitiasis', 'Trastorno de la Conducta Alimentaria (TCA)',
            'Anemia ferropénica', 'Deficiencia de Vitamina D'
        ],
        psychotherapy: [
            'Trastorno de Ansiedad Generalizada', 'Episodios Depresivos Previos', 'Trastorno Depresivo Mayor', 'Trastorno de Pánico', 'Fobia Social',
            'Trastorno Bipolar', 'TDAH', 'Trastorno Límite de la Personalidad', 'TOC', 'Trastorno de Estrés Postraumático (TEPT)',
            'Trastornos del Sueño (Insomnio)', 'Ideación suicida previa', 'Trastorno por uso de sustancias', 'Esquizofrenia', 'Trastorno adaptativo',
            'Problemas de ira/control de impulsos', 'Epilepsia', 'Autolesiones previas', 'Trastornos de la Conducta Alimentaria', 'Duelo complicado'
        ],
        pediatric: [
            'Asma bronquial', 'Rinitis alérgica', 'Dermatitis atópica', 'Alergia a la proteína de la leche de vaca (APLV)', 'Retraso del desarrollo psicomotor',
            'Convulsión febril', 'Nacido pretérmino', 'Infecciones urinarias a repetición', 'Otitis media recurrente', 'Anemia del lactante',
            'Reflujo gastroesofágico fisiológico/patológico', 'TDAH', 'Trastorno del Espectro Autista (TEA)', 'Obesidad infantil', 'Soplo cardíaco inocente',
            'Cardiopatía congénita', 'Hipotiroidismo congénito', 'Displasia del desarrollo de la cadera', 'Enfermedad Celíaca', 'Varicela'
        ],
        womens_health: [
            'Síndrome de Ovario Poliquístico (SOP)', 'Endometriosis', 'Miomatosis uterina', 'Hipotiroidismo', 'Cáncer de mama en remisión',
            'Cáncer cervicouterino', 'Virus del Papiloma Humano (VPH) positivo previo', 'Displasia cervical (NIC)', 'Quistes ováricos', 'Enfermedad Pélvica Inflamatoria (EPI)',
            'Infecciones urinarias recurrentes', 'Mastopatía fibroquística', 'Sangrado uterino anormal', 'Menopausia precoz', 'Osteoporosis / Osteopenia',
            'Cesárea previa', 'Diabetes Gestacional previa', 'Preeclampsia previa', 'Abortos espontáneos recurrentes', 'Candidiasis vaginal recurrente'
        ],
        sports: [
            'Asma inducida por ejercicio', 'Esguinces a repetición (tobillo/rodilla)', 'Luxación articular previa', 'Fractura por estrés', 'Fascitis plantar',
            'Tendinopatía rotuliana', 'Tendinopatía aquilea', 'Condromalacia rotuliana', 'Síndrome de la banda iliotibial', 'Desgarro muscular previo',
            'Lesión de meniscos', 'Lesión de ligamento cruzado anterior (LCA)', 'Lumbalgia mecánica', 'Hernia discal', 'Sobrentrenamiento (Overtraining)',
            'Periostitis tibial', 'Hombro doloroso (Manguito rotador)', 'Epicondilitis', 'Conmoción cerebral previa', 'Síndrome patelofemoral'
        ],
        telemedicine: [
            'Infección de vías respiratorias superiores', 'COVID-19', 'Hipertensión Arterial controlada', 'Diabetes Mellitus Tipo 2 controlada', 'Asma leve',
            'Hipotiroidismo en tratamiento', 'Ansiedad leve', 'Migraña episódica', 'Reflujo Gastroesofágico', 'Dermatitis de contacto',
            'Cistitis no complicada', 'Lumbalgia aguda benigna', 'Gastroenteritis aguda leve', 'Conjuntivitis alérgica', 'Rinofaringitis viral',
            'Dolor crónico somático', 'Insomnio primario', 'Trastorno Depresivo leve', 'Seguimiento de laboratorio rutinario', 'Renovación de receta médica'
        ],
        procedure: [
            'Hipertensión Arterial', 'Diabetes Mellitus Tipo 2', 'Marcapasos', 'Arritmia cardíaca', 'Cardiopatía isquémica',
            'Enfermedad Renal Crónica', 'Hepatopatía', 'Coagulopatía', 'Trastorno hemorrágico', 'Asma / EPOC',
            'Alergia a anestésicos', 'Implantes metálicos / prótesis', 'Inmunosupresión', 'Uso crónico de anticoagulantes', 'Obesidad mórbida',
            'Reflujo severo (riesgo aspiración)', 'Historia de intubación difícil', 'Enfermedad cerebrovascular previa', 'Trombosis Venosa Profunda (TVP) previa', 'Insuficiencia cardíaca congestiva'
        ],
        preventive_specialized: [
            'Sedentarismo', 'Tabaquismo', 'Obesidad', 'Hipertensión Arterial', 'Diabetes Mellitus Tipo 2',
            'Dislipidemia', 'Síndrome Metabólico', 'Cáncer familiar', 'Poliposis intestinal', 'Osteopenia'
        ],
        occupational_health: [
            'Hipoacusia neurosensorial', 'Lumbalgia mecánica', 'Síndrome del Túnel Carpiano', 'Epicondilitis', 'Asma ocupacional',
            'Dermatitis de contacto', 'Trastorno del sueño', 'Estrés crónico', 'Hernia discal', 'Miopatía'
        ],
        acute_resp: [
            'Asma bronquial', 'EPOC', 'Rinitis alérgica', 'Tabaquismo activo', 'Neumonía previa',
            'Inmunosupresión', 'Sinusitis crónica', 'Bronquitis crónica', 'Alergias ambientales', 'Apnea del sueño'
        ],
        acute_gastro: [
            'Gastritis', 'ERGE', 'Enfermedad Celíaca', 'Intolerancia a Lactosa', 'Síndrome de Intestino Irritable',
            'Colelitiasis', 'Úlcera péptica', 'Hepatopatía', 'Apendicectomía previa', 'Gastroenteritis recurrente'
        ],
        chronic_cardio_metabolic: [
            'Hipertensión Arterial', 'Diabetes Mellitus Tipo 2', 'Cardiopatía isquémica', 'Insuficiencia Cardíaca', 'ACV previo',
            'Enfermedad Renal Crónica', 'Dislipidemia', 'Obesidad', 'Arritmia', 'Marcapasos'
        ],
        emergency_trauma: [
            'Uso de anticoagulantes', 'Osteoporosis', 'Enfermedad de la coagulación', 'Alergia a AINEs', 'Alergia a opioides',
            'Cirugía ortopédica previa', 'Prótesis articular', 'Diabetes Mellitus', 'Convulsiones', 'Hipertensión Arterial'
        ],
        clinical_observation: [
            'Episodios febriles previos inespecíficos', 'Inmunosupresión (VIH/Quimio)', 'Viaje reciente a zona endémica', 'Exposición a tóxicos', 'Alergia medicamentosa severa',
            'Enfermedad autoinmune no filiada', 'Episodios sincopales recurrentes', 'Uso crónico de corticoides', 'Disfunción renal basal', 'Cardiopatía subyacente'
        ],
        followup_general: [
            'Patología basal controlada', 'Enfermedad crónica estable', 'Hipertensión Arterial benigna', 'Diabetes Mellitus compensada', 'Hipotiroidismo controlado',
            'Asma en remisión clínica', 'Dislipidemia en metas', 'Migraña episódica en prevención', 'Trastorno ansioso-depresivo estable', 'Reflujo gastroesofágico bajo control'
        ],
        followup_postop: [
            'Cirugía reciente sin complicaciones', 'Hipertensión perioperatoria', 'Alergia a AINEs / Opioides', 'Historia de TVP/TEP previa', 'Diabético (riesgo de infección de herida)',
            'Obesidad severa', 'Neumopatía (riesgo atelectasia)', 'Inmunosupresión', 'Reacción vasovagal previa', 'Cicatrización queloide conocida'
        ],
        followup_exams: [
            'Sospecha diagnóstica inicial', 'Marcadores tumorales elevados previos', 'Anemia en estudio', 'Alteración del perfil hepático', 'Sospecha de enfermedad autoinmune',
            'Chequeo preventivo anual', 'Control de riesgo cardiovascular', 'Microalbuminuria en seguimiento', 'Alteración tiroidea en dosis', 'Disglucemia en vigilancia'
        ],
        interconsultation_cardiology: [
            'Hipertensión Arterial', 'Infarto Agudo Miocardio previo', 'Insuficiencia Cardíaca', 'Arritmia/Fibrilación Auricular', 'Miocardiopatía',
            'Valvulopatía', 'Uso de Marcapasos', 'Dislipidemia', 'Trombosis venosa profunda', 'Enfermedad arterial periférica'
        ],
        interconsultation_neurology: [
            'ACV/Ictus previo', 'Epilepsia/Crisis Convulsivas', 'Enfermedad de Parkinson', 'Migraña crónica', 'Neuropatía periférica',
            'Esclerosis Múltiple', 'Traumatismo craneoencefálico', 'Tumor cerebral', 'Demencia/Alzheimer', 'Miastenia Gravis'
        ],
        interconsultation_pulmonology: [
            'Asma bronquial', 'EPOC', 'Neumonía a repetición', 'Tuberculosis Pulmonar (Antecedente)', 'Fibrosis Pulmonar',
            'Apnea del Sueño (SAHS)', 'Tabaquismo Severo', 'Cáncer de pulmón', 'Bronquiectasias', 'Hipertensión Pulmonar'
        ],
        interconsultation_gastroenterology: [
            'Enfermedad por Reflujo Gastroesofágico (ERGE)', 'Hepatitis viral (B/C)', 'Cirrosis hepática', 'Enfermedad Inflamatoria Intestinal (Crohn/CUCI)', 'Úlcera péptica',
            'Pancreatitis previa', 'Colelitiasis/Colecistectomía', 'Síndrome de Intestino Irritable', 'Cáncer gástrico/colon', 'Hígado graso no alcohólico'
        ],
        interconsultation_nephrology: [
            'Enfermedad Renal Crónica', 'Lesión Renal Aguda previa', 'Nefropatía Diabética', 'Nefrolitiasis (Cálculos a repetición)', 'Glomerulonefritis',
            'Infecciones urinarias recurrentes', 'Riñón poliquístico', 'Hemodiálisis/Diálisis peritoneal', 'Trasplante renal', 'Proteinuria en estudio'
        ],
        interconsultation_endocrinology: [
            'Diabetes Mellitus Tipo 1', 'Diabetes Mellitus Tipo 2', 'Hipotiroidismo', 'Hipertiroidismo', 'Nódulo Tiroideo',
            'Osteoporosis', 'Síndrome Metabólico', 'SOP (Síndrome Ovario Poliquístico)', 'Hiperprolactinemia', 'Insuficiencia Adrenal'
        ],
        interconsultation_hematology: [
            'Anemia Ferropénica', 'Trombocitopenia', 'Trombofilia', 'Leucopenia', 'Linfoma previo',
            'Trastorno de coagulación', 'Mieloma Múltiple', 'Poliglobulia', 'Uso crónico de anticoagulantes', 'Transfusiones previas'
        ],
        interconsultation_infectious_diseases: [
            'Infección por VIH', 'Hepatitis B/C', 'Tuberculosis previa', 'Sífilis de origen incierto', 'Infección urinaria recurrente',
            'Fiebre de Origen Desconocido', 'Endocarditis Infecciosa', 'Infección de Prótesis', 'Uso reciente de antibióticos de amplio espectro', 'Viaje reciente a zona tropical'
        ],
        interconsultation_rheumatology: [
            'Artritis Reumatoide', 'Lupus Eritematoso Sistémico', 'Osteoartritis severa', 'Gota / Hiperuricemia', 'Espondilitis Anquilosante',
            'Fibromialgia', 'Síndrome de Sjögren', 'Esclerosis Sistémica', 'Polimialgia Reumática', 'Vasculitis'
        ],
        interconsultation_oncology: [
            'Antecedente de Cáncer de Mama', 'Antecedente de Cáncer de Próstata', 'Cáncer de Colon previo', 'Nódulo Pulmonar sospechoso', 'Pérdida de peso involuntaria maligna',
            'Uso previo de Quimioterapia', 'Uso previo de Radioterapia', 'Antecedentes familiares de cáncer (>2 familiares 1er grado)', 'Marcadores tumorales elevados', 'Síndrome Paraneoplásico'
        ],
        interconsultation_dermatology: [
            'Psoriasis', 'Dermatitis Atópica / Eczema', 'Acné Severo', 'Cáncer de Piel No Melanoma / Melanoma', 'Rosácea',
            'Vitiligo', 'Urticaria Crónica', 'Infección Fúngica Recurrente', 'Alopecia', 'Nevo Atípico / Displásico'
        ],
        interconsultation_ophthalmology: [
            'Cataratas', 'Glaucoma', 'Retinopatía Diabética', 'Desprendimiento de Retina', 'Degeneración Macular',
            'Miopía Alta', 'Astigmatismo Severo', 'Estrabismo', 'Uveítis', 'Queratocono'
        ],
        interconsultation_otolaryngology: [
            'Hipoacusia / Sordera', 'Tinnitus', 'Rinitis Alérgica Crónica', 'Sinusitis Recurrente', 'Vértigo / Enfermedad de Meniere',
            'Otitis Media Crónica', 'Amigdalitis a Repetición', 'Apnea Obstructiva del Sueño', 'Pólipos Nasales', 'Parálisis Facial Periférica'
        ],
        interconsultation_urology: [
            'Hiperplasia Benigna de Próstata', 'Cólico Nefrítico/Litiasis Renal', 'Infecciones Urinarias Recurrentes', 'Cáncer de Próstata', 'Incontinencia Urinaria',
            'Prostatitis', 'Cáncer de Vejiga', 'Criptorquidia', 'Hematuria en Estudio', 'Disfunción Eréctil'
        ],
        interconsultation_orthopedics: [
            'Artrosis / Osteoartritis Severa', 'Fracturas Predisponentes', 'Osteoporosis', 'Hernia Discal Sintomática', 'Sustitución Protésica (Rodilla/Cadera)',
            'Escoliosis', 'Tendinopatía Crónica', 'Bursitis Reincidente', 'Esguinces Recurrentes', 'Síndrome del Túnel Carpiano'
        ],
        interconsultation_psychiatry: [
            'Episodios Depresivos Previos', 'Trastorno Bipolar', 'Esquizofrenia', 'Intento de Suicidio Previo', 'Trastorno de Ansiedad Generalizada',
            'TEPT (Estrés Postraumático)', 'TDAH', 'Trastorno de la Personalidad', 'Abuso de Sustancias / Alcoholismo', 'TOC (Trastorno Obsesivo-Compulsivo)'
        ],
        interconsultation_geriatrics: [
            'Deterioro Cognitivo Leve', 'Demencia (Alzheimer/Vascular)', 'Caídas Recurrentes', 'Incontinencia Urinaria/Fecal', 'Polifarmacia',
            'Desnutrición / Sarcopenia', 'Depresión Geriátrica', 'Osteoporosis severa', 'Delirium Previo', 'Fragilidad'
        ],
        interconsultation_gynecology: [
            'Miomatosis Uterina', 'Endometriosis', 'Síndrome de Ovario Poliquístico (SOP)', 'Cáncer Cervicouterino', 'Virus del Papiloma Humano (VPH)',
            'Enfermedad Pélvica Inflamatoria (EPI)', 'Sangrado Uterino Anormal', 'Quistes Ováricos', 'Infertilidad', 'Prolapso de Órganos Pélvicos'
        ],
        interconsultation_surgery: [
            'Cirugías Abdominales Previas', 'Hernia Umbilical / Inguinal', 'Colelitiasis Sintomática', 'Evento Tromboembólico Previo (TVP/TEP)', 'Rechazo/Alergia a Anestesia',
            'Obesidad Mórbida', 'Apendicectomía', 'Cicatrización Queloide', 'Hemorragia Postquirúrgica Previa', 'Adherencias Pélvicas/Abdominales'
        ],
        interconsultation_allergy: [
            'Rinitis Alérgica', 'Asma Alérgica', 'Dermatitis Atópica / Eczema', 'Anafilaxia Previa', 'Alergia a Medicamentos (Penicilina/AINEs)',
            'Alergia Alimentaria Severa', 'Urticaria Crónica', 'Alergia a Picadura de Insectos', 'Angioedema', 'Sensibilidad a Látex'
        ],
        default: [
            'Hipertensión Arterial', 'Diabetes Mellitus Tipo 2', 'Dislipidemia', 'Asma', 'Gastritis',
            'Reflujo Gastroesofágico', 'Hipotiroidismo', 'Enfermedad Renal Crónica', 'Artritis Reumatoide', 'Artrosis',
            'Migraña', 'EPOC', 'Ansiedad/Depresión', 'Alergias estacionales', 'Hernia discal',
            'Cálculos renales', 'Cálculos biliares', 'Anemia', 'Cirugías previas sin complicaciones', 'Enfermedad coronaria'
        ]
    },
    habits: {
        nutrition: [
            'Tabaquismo activo', 'Alcoholismo ocasional', 'Sedentarismo (<150 min/semana)', 'Patrón de picoteo entre comidas', 'Consumo elevado de carbohidratos simples',
            'Consumo alto de bebidas azucaradas', 'Poco consumo de agua (<1L/día)', 'Comidas fuera de casa frecuentes', 'Atracones alimentarios nocturnos', 'Dieta vegetariana/vegana sin suplementación',
            'Consumo excesivo de sodio', 'Baja ingesta de frutas y verduras', 'Ayuno intermitente sin supervisión', 'Saltarse el desayuno', 'Uso de suplementos (proteína, quemadores)',
            'Masticación rápida', 'Alimentación emocional', 'Alteración del ritmo circadiano (trabajo nocturno)', 'Estrés crónico percibido', 'Sueño insuficiente (<6h)'
        ],
        psychotherapy: [
            'Consumo de alcohol frecuente/excesivo', 'Consumo de cannabis', 'Consumo de cocaína u otras drogas', 'Tabaquismo (vapeo/cigarrillo)', 'Insomnio crónico',
            'Privación voluntaria del sueño', 'Uso excesivo de pantallas (>6h/día)', 'Redes sociales como evasión', 'Baja interacción social / Aislamiento', 'Sedentarismo severo',
            'Procrastinación compensatoria', 'Hábitos de autolesión', 'Dependencia emocional a la pareja', 'Rituales compulsivos', 'Juego patológico / apuestas',
            'Hipersexualidad / conductas de riesgo', 'Exceso de cafeína/bebidas energéticas', 'Alimentación restrictiva por imagen corporal', 'Atracones emocionales', 'Ejercicio extenuante compensatorio'
        ],
        pediatric: [
            'Alimentación complementaria adecuada', 'Consumo de azúcares antes de los 2 años', 'Uso prolongado de biberón', 'Lactancia materna exclusiva', 'Lactancia mixta',
            'Fórmula infantil exclusiva', 'Exceso de pantallas (>1-2h según edad)', 'Falta de rutina de sueño', 'Alteración del sueño / terrores nocturnos', 'Sedentarismo / falta de juego activo',
            'Colecho inseguro', 'Exposición a humo de tabaco (Tabaquismo pasivo)', 'Uso de chupete frecuente', 'Dificultad para masticar sólidos', 'Rechazo de vegetales (Neofobia alimentaria)',
            'Poca ingesta de agua', 'Higiene dental deficiente / sin supervisión', 'Falta de interacción con pares', 'Berrinches / rabietas frecuentes', 'Uso de pantallas durante comidas'
        ],
        womens_health: [
            'Tabaquismo activo (riesgo trombótico con ACO)', 'Consumo regular de alcohol', 'Actividad física > 3 veces/semana', 'Dieta baja en calcio/vitamina D', 'Consumo alto de cafeína',
            'Dietas restrictivas extremas', 'Falta de higiene del sueño', 'Estrés crónico', 'Uso de copita menstrual/tampones', 'Duchas vaginales (hábito perjudicial)',
            'Multiparidad', 'Inicio temprano de relaciones sexuales', 'Uso de anticonceptivos orales crónico', 'Falta de chequeo ginecológico anual', 'Sedentarismo',
            'Automedicación analgésica mensual', 'Trabajo por turnos/nocturno', 'Consumo de suplementos de hierro/ácido fólico', 'Prácticas sexuales de riesgo (sin barrera)', 'Lavado pélvico excesivo'
        ],
        sports: [
            'Entrenamiento > 5 días/semana', 'Rutina de fuerza y resistencia', 'Entrenamiento en ayunas', 'Suplementación con Whey Protein', 'Uso de Creatina',
            'Uso de pre-entrenos/estimulantes', 'Uso de esteroides anabólicos (EAAs)', 'Déficit de horas de sueño/recuperación', 'Buena hidratación (>2.5L)', 'Dieta hiperproteica',
            'Estrés competitivo alto', 'Saltarse días de descanso activo', 'Estiramiento nulo o deficiente', 'Calentamiento insuficiente', 'Uso de calzado inadecuado',
            'Cambios bruscos de volumen/intensidad de carga', 'Consumo de alcohol post-competición', 'Tabaquismo ocasional', 'Consumo de antiinflamatorios (AINEs) crónico', 'Restricción calórica severa'
        ],
        telemedicine: [
            'Sedentarismo', 'Tabaquismo', 'Consumo moderado de alcohol', 'Exceso de cafeína', 'Dieta alta en ultraprocesados',
            'Trabajo de oficina prolongado', 'Mala ergonomía (dolor postural)', 'Uso constante de monitores (fatiga visual)', 'Alteración del sueño', 'Estrés laboral/Burnout',
            'Poco consumo de líquidos', 'Actividad física esporádica', 'Uso de remedios caseros / automedicación', 'Dietas de moda', 'Aislamiento en casa',
            'Consumo de melatonina', 'Uso de medicamentos de venta libre', 'Desreguladores del ritmo de comidas', 'Exposición tardía a luz azul', 'Ejercicio en casa sin guía'
        ],
        procedure: [
            'Tabaquismo activo', 'Uso de drogas recreativas', 'Consumo de alcohol diario', 'Sedentarismo', 'Uso de suplementos herbarios/naturales',
            'Ayuno preoperatorio no respetado', 'Automedicación con AINEs/Aspirina', 'Poca red de apoyo en casa', 'Dieta pro-inflamatoria', 'Estrés severo pre-cirugía',
            'Tabaquismo pasivo', 'Vómitos inducidos', 'Trastornos del sueño severos', 'Automedicación con esteroides', 'Uso frecuente de laxantes',
            'Exposición a toxinas laborales', 'Higiene bucal deficiente', 'Dieta baja en proteínas', 'Ingesta baja de líquidos pre-cirugía', 'Desnutrición calórico-proteica'
        ],
        preventive_specialized: [
            'Tabaquismo activo', 'Sedentarismo', 'Consumo alto de ultraprocesados', 'Bajo consumo de agua', 'Alcohol diario',
            'Privación de sueño', 'Estrés alto', 'No uso de bloqueador solar', 'Dieta baja en fibra', 'Salto de comidas'
        ],
        occupational_health: [
            'Pausas activas nulas', 'Uso inadecuado de EPP', 'Postura prolongada', 'Carga repetitiva', 'Exposición a ruido',
            'Trabajo por turnos nocturnos', 'Pantalla >8h/día', 'Asientos sin soporte lumbar', 'Manejo manual de cargas', 'Estrés laboral alto'
        ],
        chronic_cardio_metabolic: [
            'Dietas altas en sodio', 'Exceso de azúcares', 'Sedentarismo grave', 'Tabaquismo activo', 'Adherencia irregular a medicación',
            'Consumo de alcohol excesivo', 'Falta de monitoreo glucémico', 'Pocas horas de sueño', 'Cenas copiosas', 'Bajo consumo de verduras'
        ],
        emergency_trauma: [
            'Consumo de alcohol peritraumático', 'Uso de sustancias psicoactivas', 'No uso de cinturón de seguridad', 'No uso de casco', 'Deportes de riesgo',
            'Sedentarismo', 'Tabaquismo', 'Falta de sueño', 'Actividad laboral de riesgo', 'Conducción temeraria'
        ],
        clinical_observation: [
            'Contacto con animales exóticos/enfermos', 'Consumo de agua no potabilizada', 'Picaduras de insectos/garrapatas recientes', 'Consumo reciente de alimentos en dudoso estado', 'Automedicación con antibióticos'
        ],
        followup_general: [
            'Adherencia completa al tratamiento', 'Olvido ocasional de dosis', 'Buena tolerancia gástrica', 'Efectos adversos leves (mareo, náusea)', 'Cambios dietéticos implementados',
            'Inicio de actividad física', 'Cese de tabaquismo (>1 mes)', 'Higiene del sueño mejorada', 'Reducción de ingesta de alcohol', 'Control de peso progresivo'
        ],
        followup_postop: [
            'Reposo relativo cumplido', 'Deambulación temprana iniciada', 'Tolerancia vía oral adecuada', 'Uso correcto de faja/vendaje', 'Cuidado de herida sin humedad',
            'Medicación analgésica reglada', 'Restricción de carga de peso', 'Uso de medias antitrombóticas', 'Fisioterapia respiratoria', 'Ayuno postoperatorio inicial'
        ],
        followup_exams: [
            'Ayuno de 12 horas cumplido', 'Muestra aislada', 'Suspensión de medicación previa', 'Recolección de orina de 24h correcta', 'Preparación intestinal completa',
            'Abstinencia sexual previa', 'No ejercicio vigoroso previo', 'Dieta estricta cumplida', 'Hidratación oral abundante', 'Muestra tomada durante fiebre'
        ],
        interconsultation_cardiology: [
            'Tabaquismo activo', 'Consumo excesivo de sodio', 'Sedentarismo', 'Dietas altas en grasas saturadas', 'Bajo consumo de potasio/fibra'
        ],
        interconsultation_neurology: [
            'Consumo perjudicial de alcohol', 'Alteraciones graves del ritmo circadiano', 'Consumo de sustancias psicoactivas', 'Uso crónico de benzodiacepinas', 'Falta de estimulación cognitiva'
        ],
        interconsultation_pulmonology: [
            'Tabaquismo activo (alto índice tabáquico)', 'Exposición a biomasa/humo de leña', 'Vapeo/Cigarrillo electrónico', 'Exposición ocupacional a polvos/químicos', 'Tabaquismo pasivo'
        ],
        interconsultation_gastroenterology: [
            'Dieta baja en fibra', 'Consumo alto de ultraprocesados', 'Consumo diario de alcohol', 'Uso frecuente de AINEs/Aspirina', 'Saltarse comidas frecuentemente'
        ],
        interconsultation_nephrology: [
            'Baja ingesta de líquidos', 'Consumo abusivo de AINEs', 'Uso de suplementos proteicos altos', 'Dietas hiperproteicas sin supervisión', 'Consumo excesivo de analgésicos'
        ],
        interconsultation_endocrinology: [
            'Dietas ricas en azúcares refinados', 'Sedentarismo grave', 'Consumo irregular de alimentos (saltos de comida)', 'Uso de corticoides automedicados', 'Alteraciones graves del ritmo de sueño'
        ],
        interconsultation_hematology: [
            'Dieta vegetariana estricta (sin suplementación)', 'Consumo elevado de alcohol', 'Exposición laboral a solventes/benceno', 'Automedicación con AINEs', 'Tabaquismo intenso'
        ],
        interconsultation_infectious_diseases: [
            'Consumo de drogas intravenosas', 'Prácticas sexuales de riesgo', 'Convivencia con personas infectadas (TBC)', 'Consumo de carne cruda/leche sin pasteurizar', 'Tatuajes/Piercings recientes no seguros'
        ],
        interconsultation_rheumatology: [
            'Tabaquismo activo (empeora AR)', 'Sedentarismo', 'Mala ergonomía postural', 'Dieta pro-inflamatoria (alta en grasas saturadas)', 'Esfuerzo físico repetitivo'
        ],
        interconsultation_oncology: [
            'Tabaquismo (activo/pasivo)', 'Alcoholismo', 'Dieta baja en fibra/alta en carnes procesadas', 'Exposición solar sin protección', 'Exposición a carcinógenos ocupacionales'
        ],
        interconsultation_dermatology: [
            'Exposición Solar sin Protección', 'Uso Frecuente de Cámaras de Bronceado', 'Cuidado de la Piel Inadecuado/Irritantes', 'Rascado Compulsivo', 'Falta de Hidratación Cutánea'
        ],
        interconsultation_ophthalmology: [
            'Uso de Pantallas >8h sin Descanso', 'No Uso de Lentes con Filtro UV', 'Frotarse los Ojos Frecuentemente', 'Mala Higiene con Lentes de Contacto', 'Tabaquismo (Riesgo Degeneración Macular)'
        ],
        interconsultation_otolaryngology: [
            'Uso Frecuente de Audífonos a Alto Volumen', 'Exposición a Ruido Laboral Constante', 'Tabaquismo (Riesgo de Cáncer Laríngeo)', 'Reflujo Faringolaríngeo por Dieta', 'Uso Excesivo de Gotas Nasales Descongestionantes'
        ],
        interconsultation_urology: [
            'Baja Ingesta de Líquidos', 'Retención Voluntaria de Orina Prolongada', 'Tabaquismo (Alto Riesgo Ca. Vejiga)', 'Exceso de Proteína Animal / Sal', 'Consumo Excesivo de Alcohol'
        ],
        interconsultation_orthopedics: [
            'Sobreesfuerzo Físico Repetitivo', 'Mala Postura Ergonómica Prolongada', 'Carga de Objetos Pesados Incorrecta', 'Sedentarismo Absoluto', 'Sobrepeso/Obesidad (Carga Articular)'
        ],
        interconsultation_psychiatry: [
            'Consumo de Alcohol Frecuente', 'Uso de Drogas Recreativas', 'Insomnio Crónico', 'Juego Patológico (Ludopatía)', 'Aislamiento Social Severo'
        ],
        interconsultation_geriatrics: [
            'Aislamiento Social / Soledad', 'Sedentarismo Absoluto', 'Dieta Deficiente en Proteínas', 'Automediación Elevada', 'Falta de Exposición Solar'
        ],
        interconsultation_gynecology: [
            'Tabaquismo (Riesgo cardiovascular con ACOs)', 'Duchas Vaginales Frecuentes', 'Falta de Higiene Menstrual Adecuada', 'Múltiples Parejas Sexuales sin Protección', 'Consumo Alto de Fitoestrógenos sin Control'
        ],
        interconsultation_surgery: [
            'Tabaquismo Activo (Riesgo de Cicatrización)', 'Uso de Suplementos Herbales (Riesgo de Sangrado)', 'Ayuno Prolongado Previo', 'Uso Frecuente de Fajas Reductoras', 'Sedentarismo Extremo'
        ],
        interconsultation_allergy: [
            'Exposición Constante a Mascotas', 'Falta de Ventilación en el Hogar', 'Uso Constante de Aromatizantes/Inciensos', 'Exposición a Ácaros (Alfombras/Peluches)', 'Automediación con Antihistamínicos'
        ],
        default: [
            'Tabaquismo activo', 'Ex tabaquismo', 'Nunca fumador', 'Alcohol ocasional social', 'Bebe alcohol frecuentemente',
            'Sedentarismo', 'Actividad física regular (3+ veces/semana)', 'Dieta balanceada', 'Dieta rica en grasas/carbohidratos', 'Uso de drogas recreativas',
            'Buena hidratación', 'Exceso de cafeína', 'Horarios de sueño regulares', 'Insomnio moderado/severo', 'Trabajo de alto estrés',
            'Trabajo sedentario (oficina)', 'Automedicación', 'Tabaquismo pasivo', 'Uso rutinario de pantallas en la cama', 'Patrón alimentario irregular'
        ]
    },
    family: {
        nutrition: [
            'Obesidad', 'Diabetes Mellitus Tipo 2', 'Enfermedad Cardiovascular Prematura', 'Infarto Agudo al Miocardio (<55 años)', 'Hipertensión Arterial',
            'Dislipidemia Familiar', 'Cáncer gástrico', 'Cáncer de colon', 'Hipotiroidismo', 'Hipertiroidismo',
            'Enfermedad Celíaca', 'Enfermedades autoinmunes', 'Resistencia a la insulina', 'Síndrome de Ovario Poliquístico', 'Trastornos de la Conducta Alimentaria',
            'Gota / Hiperuricemia', 'Enfermedad Renal Crónica', 'Osteoporosis severa', 'Alzheimer / Demencia', 'Amputación por pie diabético'
        ],
        psychotherapy: [
            'Historial familiar de Depresión', 'Suicidio en la familia', 'Trastorno Bipolar', 'Esquizofrenia', 'Adicciones / Alcoholismo',
            'TDAH familiar', 'Trastorno de Ansiedad', 'Trastornos de la Conducta Alimentaria', 'TOC', 'Demencia o Alzheimer',
            'Enfermedad de Parkinson', 'Trastorno Límite de la Personalidad', 'Violencia intrafamiliar', 'Abusos o traumas transgeneracionales', 'Epilepsia',
            'Trastornos del espectro autista', 'Enfermedad de Huntington', 'Institucionalización psiquiátrica de familiar', 'Abandono paterno/materno', 'Trastorno antisocial de la personalidad'
        ],
        pediatric: [
            'Asma en padres/hermanos', 'Alergias severas', 'Rinitis alérgica familiar', 'Dermatitis atópica', 'Convulsiones febriles en familiares',
            'Enfermedad Celíaca', 'Cardiopatía congénita familiar', 'Sordera congénita', 'Ceguera congénita', 'Trastorno del Espectro Autista (TEA)',
            'TDAH familiar', 'Enfermedades metabólicas', 'Fibrosis quística', 'Hemofilia', 'Miopía magna o severa',
            'Displasia del desarrollo de la cadera', 'Hipotiroidismo', 'Muerte súbita del lactante en hermanos', 'Obesidad infantil familiar', 'Diabetes Mellitus Tipo 1 en padres'
        ],
        womens_health: [
            'Cáncer de Mama (Madre/Hermana)', 'Cáncer de Ovario', 'Cáncer de endometrio', 'Cáncer cérvicouterino', 'Trombofilia',
            'Menopausia Precoz Familiar', 'Osteoporosis', 'Síndrome de Ovario Poliquístico (Madre/Hermana)', 'Endometriosis severa', 'Diabetes Mellitus',
            'Hipertensión', 'Enfermedad Cardiovascular prematura', 'Hipotiroidismo', 'Trastornos tiroideos autoinmunes', 'Útero miomatoso (antecedente materno)',
            'Pre-eclampsia en embarazos maternos', 'Abortos recurrentes maternos', 'Malformaciones congénitas', 'Fibroadenomas comunes en la familia', 'Infertilidad familiar'
        ],
        sports: [
            'Muerte súbita cardíaca en atletas familiares', 'Miocardiopatía hipertrófica', 'Síndrome de Marfan', 'Enfermedades del colágeno (Ehlers-Danlos)', 'Osteoartritis prematura',
            'Artritis Reumatoide', 'Enfermedad Cardiovascular antes de los 50', 'Hipertensión Arterial', 'Diabetes tipo 1', 'Diabetes tipo 2',
            'Asma bronquial', 'Osteoporosis', 'Luxaciones articulares recurrentes (hiperlaxitud)', 'Trastornos de coagulación', 'Displasia de cadera',
            'Escoliosis idiopática', 'Gota', 'Sarcopenia genética', 'Trastornos tiroideos', 'Tendencia a hernias abdominales'
        ],
        telemedicine: [
            'Hipertensión Arterial', 'Diabetes Mellitus', 'Cáncer', 'Enfermedad Cardíaca', 'ACV / Derrame Cerebral',
            'Asma', 'Depresión', 'Demencia / Alzheimer', 'Enfermedad Renal', 'Trastornos Tiroideos',
            'Obesidad', 'Migraña', 'Glaucoma', 'Epilepsia', 'Autismo',
            'Parkinson', 'Alergias respiratorias', 'Enfermedades autoinmunes', 'Artritis', 'Osteoporosis'
        ],
        procedure: [
            'Hemorragias / Trastornos de la coagulación', 'Reacciones adversas a anestesia', 'Déficit de pseudocolinesterasa', 'Cardiopatías', 'Hipertensión',
            'Diabetes', 'Enfermedad Renal', 'Enfermedad Pulmonar (EPOC/Asma)', 'Enfermedades tromboembólicas', 'Cáncer familiar',
            'Infecciones crónicas (Hepatitis, VIH)', 'Alergias severas a medicamentos', 'Fallo cardíaco', 'Deficiencias inmunológicas', 'Disautonomía familiar',
            'Neuropatías hereditarias', 'Apnea del sueño severa', 'Obesidad mórbida', 'Porfiria', 'Trombofilias'
        ],
        preventive_specialized: [
            'Cáncer de Mama (familiar 1er grado)', 'Cáncer de Colon (familiar 1er grado)', 'Infarto antes de 55 años', 'Diabetes Mellitus', 'Hipertensión Arterial',
            'Muerte súbita familiar', 'Dislipidemia familiar', 'Enfermedad Renal', 'Glaucoma', 'Osteoporosis'
        ],
        occupational_health: [
            'Hipertensión Arterial', 'Diabetes Mellitus', 'Enfermedades Cardiovasculares', 'Asma', 'Hipoacusia familiar',
            'Trastornos visuales hereditarios', 'Patología de columna', 'Alergias severas', 'Enfermedad autoinmune', 'Cáncer'
        ],
        chronic_cardio_metabolic: [
            'Infarto Agudo Miocardio', 'Accidente Cerebrovascular', 'Diabetes Mellitus Tipo 2', 'Hipertensión Severa', 'Dislipidemia Familiar',
            'Muerte Súbita', 'Enfermedad Arterial Periférica', 'Insuficiencia Renal', 'Obesidad', 'Trombofilia'
        ],
        emergency_trauma: [
            'Trastornos de coagulación', 'Hemofilia', 'Osteogénesis imperfecta', 'Enfermedades del colágeno', 'Hipertermia maligna',
            'Alergias graves a anestésicos', 'Reacciones adversas intrahospitalarias', 'Diabetes Mellitus', 'Enfermedades cardiovasculares', 'Inmunodeficiencias'
        ],
        clinical_observation: [
            'Familiares con cuadro febril similar', 'Fiebre Mediterránea Familiar', 'Contacto domiciliario con TBC', 'Hepatitis viral familiar', 'Enfermedades autoinmunes familiares'
        ],
        followup_general: [
            'Antecedentes familiares sin cambios desde última visita', 'Nuevo diagnóstico de diabetes en familiar', 'Nuevo diagnóstico oncológico en familiar', 'Evento cardiovascular reciente en padres', 'Enfermedad reumatológica nueva en familia'
        ],
        followup_postop: [
            'Sin antecedentes familiares de sangrado', 'Sin complicaciones anestésicas familiares', 'Trombofilia familiar', 'Retraso de cicatrización en familia', 'Infecciones recurrentes familiares'
        ],
        followup_exams: [
            'Enfermedad genética familiar', 'Portadores de mutación BRCA1/2', 'Portadores de Factor V Leiden', 'Cáncer hereditario (Lynch, PAF)', 'Trastornos metabólicos familiares'
        ],
        interconsultation_cardiology: [
            'Muerte súbita joven en familiares', 'Enfermedad coronaria precoz (<55 años)', 'Miocardiopatía familiar', 'Hipercolesterolemia familiar', 'Valvulopatías congénitas'
        ],
        interconsultation_neurology: [
            'Enfermedad de Alzheimer temprana', 'Enfermedad de Parkinson familiar', 'Corea de Huntington', 'Epilepsia genética', 'Aneurismas cerebrales familiares'
        ],
        interconsultation_pulmonology: [
            'Asthma severo familiar', 'Cáncer de pulmón en no fumadores', 'Fibrosis quística', 'Déficit de alfa-1 antitripsina', 'Tuberculosis en contacto cercano'
        ],
        interconsultation_gastroenterology: [
            'Cáncer de colon familiar', 'Poliposis Adenomatosa Familiar', 'Enfermedad de Crohn/CUCI familiar', 'Cáncer gástrico en 1er grado', 'Enfermedad genética hepática (Wilson/Hemocromatosis)'
        ],
        interconsultation_nephrology: [
            'Enfermedad Renal Poliquística', 'Enfermedad de Alport', 'Nefropatías hereditarias', 'Cálculos renales familiares', 'Fallo renal en familiares de 1er grado'
        ],
        interconsultation_endocrinology: [
            'Diabetes Mellitus Tipo 1 en familiares', 'Enfermedad de Graves / Hashimoto Fmailiar', 'Neoplasia Endocrina Múltiple (MEN)', 'Hipercolesterolemia Familiar', 'Osteoporosis Prematura'
        ],
        interconsultation_hematology: [
            'Hemofilia A/B familiar', 'Anemia Drepanocítica', 'Talasemia Mayor/Menor', 'Trombofilia Hereditaria (Ej. Factor V Leiden)', 'Linfoma/Leucemia Familiar'
        ],
        interconsultation_infectious_diseases: [
            'Conviviente con VIH positivo', 'Tuberculosis Familiar Activa', 'Infecciones Recurrentes (Inmunodeficiencia Primaria)', 'Hepatitis B o C Crónica en el Hogar', 'Endemia Geográfica Familiar'
        ],
        interconsultation_rheumatology: [
            'Artritis Reumatoide Familiar', 'Lupus Eritematoso Sistémico en 1er grado', 'Espondilitis Anquilosante (HLA-B27 familiar)', 'Gota Familiar', 'Síndrome de Sjögren'
        ],
        interconsultation_oncology: [
            'Cáncer de Mama o de Ovario (BRCA1/2)', 'Síndrome de Lynch (Cáncer Colorrectal)', 'Poliposis Adenomatosa Familiar', 'Síndrome de Li-Fraumeni', 'Cáncer Gástrico Familiar'
        ],
        interconsultation_dermatology: [
            'Melanoma en Familia', 'Psoriasis Familiar', 'Atopia/Alergias Severas', 'Albinismo', 'Neurofibromatosis'
        ],
        interconsultation_ophthalmology: [
            'Glaucoma Familiar', 'Degeneración Macular Relacionada a la Edad', 'Miopía Hereditaria', 'Ceguera de Origen Desconocido', 'Daltonismo'
        ],
        interconsultation_otolaryngology: [
            'Sordera Congénita', 'Hipoacusia Hereditaria Tardía', 'Cáncer Nasofaríngeo Familiar', 'Otosclerosis Familiar', 'Síndromes de Vértigo Familiar'
        ],
        interconsultation_urology: [
            'Cáncer de Próstata Familiar', 'Litiasis Renal Recurrente', 'Riñones Poliquísticos', 'Malformaciones Genitourinarias Congénitas', 'Cáncer Renal Hereditario'
        ],
        interconsultation_orthopedics: [
            'Osteoporosis Prematura', 'Osteogénesis Imperfecta', 'Espondilitis Anquilosante Familiar', 'Osteoartritis Juvenil', 'Distrofias Musculares'
        ],
        interconsultation_psychiatry: [
            'Suicidio Consumado en Familia', 'Enfermedad Bipolar Familiar', 'Esquizofrenia en 1er Grado', 'Alcoholismo Familiar Severo', 'Depresión Mayor en Padres/Hermanos'
        ],
        interconsultation_geriatrics: [
            'Demencia Temprana Familiar', 'Enfermedad de Alzheimer en Padres', 'Longevidad Familiar Extraordinaria', 'Fragilidad Familiar Prematura', 'Osteoporosis Severa Familiar'
        ],
        interconsultation_gynecology: [
            'Cáncer de Mama en Madre/Hermana', 'Cáncer de Ovario Familiar', 'Menopausia Precoz Familiar', 'Endometriosis en 1er Grado', 'Mutación BRCA1/BRCA2 Familiar'
        ],
        interconsultation_surgery: [
            'Trombofilia Familiar', 'Reacción Adversa Grave a Anestesia en Familia', 'Hipertermia Maligna Familiar', 'Trastornos de Coagulación Hereditarios', 'Cáncer Gástrico/Colorrectal Familiar'
        ],
        interconsultation_allergy: [
            'Atopia Familiar Severa (Madre/Padre)', 'Asma Severa Familiar', 'Alergias Alimentarias Hereditarias', 'Inmunodeficiencia Primaria Familiar', 'Angioedema Hereditario'
        ],
        default: [
            'Cáncer (varios tipos)', 'Diabetes Mellitus', 'Hipertensión Arterial', 'Enfermedades Cardíacas', 'ACV / Infarto Cerebral',
            'Asma', 'Alergias severas', 'Demencia o Alzheimer', 'Enfermedades autoinmunes (Lupus, AR)', 'Depresión o trastornos psiquiátricos',
            'Enfermedades renales', 'Epilepsia', 'Glaucoma', 'Trastornos de coagulación', 'Trastornos tiroideos',
            'Enfermedad Celíaca', 'Úlcera péptica familiar', 'Enfermedad inflamatoria intestinal', 'Infarto precoz al miocardio', 'Obesidad'
        ]
    }
};
