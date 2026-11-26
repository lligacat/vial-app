/* Vial · ampliació del banc de preguntes del teòric. Preguntes pròpies del centre (no són les oficials de la DGT).
   Abans de fer-les servir amb alumnes reals, un professor les hauria de revisar amb la normativa vigent. */
(function () {
  let n = 0;
  const add = (t, list) => list.forEach(x => QB.push({ id: 'x' + (++n), t, q: x[0], o: x[1], a: x[2] }));
  add('Senyals', [
    ['Un senyal triangular amb el vèrtex cap avall i vora vermella indica…', ['Perill indefinit', 'Cediu el pas', 'Prohibit el pas'], 1],
    ['El senyal d\'STOP té forma…', ['Octogonal', 'Rodona', 'Triangular'], 0],
    ['Els senyals d\'obres amb fons groc…', ['Són només orientatius', 'No tenen valor de nit', 'Prevalen sobre la senyalització permanent'], 2],
    ['Dues llums vermelles intermitents alternatives en un pas a nivell obliguen a…', ['Aturar-se', 'Passar amb precaució', 'Accelerar per sortir de la via'], 0],
    ['Una fletxa verda encesa al semàfor permet…', ['Circular en qualsevol direcció', 'Avançar en la direcció indicada, amb precaució', 'Passar sense respectar els vianants'], 1],
    ['Si un senyal vertical i una marca vial es contradiuen, preval…', ['La marca vial', 'El senyal vertical', 'El que sigui més favorable al conductor'], 1],
    ['Una marca groga en ziga-zaga al costat de la vorada indica…', ['Que està prohibit estacionar', 'Un carril bici', 'Una zona de càrrega lliure'], 0],
    ['Una línia discontínua entre dos carrils…', ['No es pot travessar mai', 'Es pot travessar si la maniobra és segura', 'Només la poden travessar les motos'], 1],
  ]);
  add('Prioritats', [
    ['En un tram estret amb molta pendent on no es pot passar, té preferència en general…', ['El vehicle que baixa', 'El vehicle que puja', 'El vehicle més petit'], 1],
    ['En una zona residencial senyalitzada com a tal, tenen prioritat…', ['Els vianants', 'Els vehicles', 'Les motos'], 0],
    ['En sortir d\'un garatge cap a la via pública cal…', ['Passar primer si s\'ha posat l\'intermitent', 'Cedir el pas als vehicles i vianants', 'Tocar el clàxon i sortir'], 1],
    ['En una cruïlla sense senyals entre una carretera pavimentada i un camí sense pavimentar, té prioritat qui…', ['Surt del camí', 'Circula per la via pavimentada', 'Va més de pressa'], 1],
    ['Si el primer ciclista d\'un grup ja ha entrat a la rotonda…', ['La resta del grup té preferència per passar', 'Pots tallar el grup', 'Només té preferència el primer'], 0],
    ['En incorporar-te a una autovia des del carril d\'acceleració…', ['Els de la via principal t\'han de cedir el pas', 'Has de cedir el pas als que ja circulen per la via', 'Has d\'aturar-te sempre al final del carril'], 1],
    ['Quan gires i els vianants creuen el carrer on vols entrar, encara que no hi hagi pas senyalitzat…', ['Tens prioritat', 'Els has de deixar passar', 'Els has d\'avisar amb el clàxon'], 1],
    ['Un tramvia que circula pels seus carrils, com a norma general…', ['Té preferència de pas', 'Ha de cedir el pas als turismes', 'No té cap norma especial'], 0],
  ]);
  add('Velocitat i distàncies', [
    ['La velocitat mínima genèrica en autopistes i autovies és…', ['40 km/h', '60 km/h', '80 km/h'], 1],
    ['La velocitat màxima genèrica d\'un camió en autopista és…', ['90 km/h', '100 km/h', '110 km/h'], 0],
    ['La velocitat màxima genèrica d\'un autobús en autopista és…', ['80 km/h', '100 km/h', '120 km/h'], 1],
    ['En una via urbana amb dos o més carrils per sentit, el límit genèric és…', ['30 km/h', '50 km/h', '60 km/h'], 1],
    ['En una via urbana de plataforma única de calçada i vorera, el límit genèric és…', ['20 km/h', '30 km/h', '50 km/h'], 0],
    ['En avançar un ciclista en carretera, la separació lateral mínima és…', ['0,5 metres', '1 metre', '1,5 metres'], 2],
    ['Una manera pràctica de mantenir la distància de seguretat és deixar almenys…', ['Mig segon', 'Uns dos segons respecte del vehicle de davant', 'La llargada d\'un cotxe a qualsevol velocitat'], 1],
    ['La distància de detenció és…', ['La suma de la distància de reacció i la de frenada', 'Només la distància de frenada', 'La distància de seguretat entre vehicles'], 0],
  ]);
  add('Alcohol i seguretat', [
    ['La taxa màxima d\'alcohol en sang per a un conductor general és…', ['0,3 g/l', '0,5 g/l', '0,8 g/l'], 1],
    ['Conduir amb presència de drogues a l\'organisme (sense prescripció)…', ['Està permès en poca quantitat', 'Està sancionat', 'Només se sanciona si hi ha accident'], 1],
    ['L\'armilla reflectora s\'ha de portar posada…', ['En sortir del vehicle a la calçada o al voral en carretera', 'Sempre mentre es condueix', 'Només de dia'], 0],
    ['El reposacaps ben ajustat ha de quedar…', ['A l\'altura de les espatlles', 'Amb la part superior a l\'altura del cap', 'El més baix possible'], 1],
    ['En trajectes llargs és recomanable descansar…', ['Cada 2 hores o 200 km aproximadament', 'Cada 6 hores', 'Només quan es té son'], 0],
    ['Una cadireta infantil en sentit contrari a la marxa al seient del davant…', ['Només es pot posar amb l\'airbag frontal desactivat', 'Necessita l\'airbag activat', 'Es pot posar sempre'], 0],
    ['El casc en motocicleta és obligatori…', ['Només en carretera', 'En vies urbanes i interurbanes', 'Només per al conductor'], 1],
    ['Conduir amb auriculars connectats a un aparell de so…', ['Està permès amb volum baix', 'Està prohibit', 'Només està prohibit de nit'], 1],
  ]);
  add('Maniobres', [
    ['En autopista, la marxa enrere…', ['Està permesa pel voral', 'Està prohibida', 'Està permesa si t\'has passat la sortida'], 1],
    ['Fer un canvi de sentit dins d\'un túnel…', ['Està prohibit', 'Es pot fer si no ve ningú', 'Es pot fer amb els llums d\'emergència'], 0],
    ['Es considera parada la immobilització del vehicle…', ['De menys de dos minuts sense que el conductor l\'abandoni', 'De menys de deu minuts', 'Amb el motor apagat'], 0],
    ['En estacionar en una baixada, a més del fre d\'estacionament és recomanable…', ['Deixar la marxa enrere engranada', 'Deixar el punt mort', 'Deixar una marxa llarga'], 0],
    ['Estacionar en un revolt amb visibilitat reduïda…', ['Està permès de dia', 'Està prohibit', 'Està permès amb intermitents'], 1],
    ['Avançar en un pas per a vianants senyalitzat, com a norma general…', ['Està prohibit', 'És obligatori', 'No té cap limitació'], 0],
    ['El carril d\'acceleració serveix per…', ['Aturar-se a esperar', 'Adaptar la velocitat abans d\'incorporar-se', 'Avançar altres vehicles'], 1],
    ['En acabar un avançament, per tornar al carril de la dreta cal…', ['Senyalitzar amb l\'intermitent i fer-ho progressivament', 'Fer-ho de cop sense senyalitzar', 'Fer servir els llums d\'emergència'], 0],
  ]);
  add('Vehicle i documents', [
    ['La profunditat mínima legal del dibuix d\'un pneumàtic de turisme és…', ['0,5 mm', '1,6 mm', '4 mm'], 1],
    ['La primera ITV d\'un turisme particular es passa als…', ['2 anys', '4 anys', '6 anys'], 1],
    ['A partir dels 10 anys, un turisme particular passa la ITV…', ['Cada dos anys', 'Cada any', 'Cada cinc anys'], 1],
    ['L\'assegurança de responsabilitat civil per circular és…', ['Voluntària', 'Obligatòria', 'Només obligatòria per a vehicles nous'], 1],
    ['Un conductor novell comença amb un saldo de…', ['8 punts', '12 punts', '15 punts'], 0],
    ['El permís B permet conduir, com a norma general, vehicles de fins a…', ['3.500 kg de massa màxima i 9 places', '7.500 kg i 9 places', '3.500 kg i 17 places'], 0],
    ['El nivell del líquid refrigerant s\'ha de comprovar…', ['Amb el motor fred', 'Amb el motor molt calent', 'Només a la ITV'], 0],
    ['El llum antiboira posterior s\'ha de fer servir…', ['Sempre de nit', 'Només amb boira densa, pluja molt intensa o fenòmens semblants', 'Amb qualsevol pluja feble'], 1],
  ]);
})();
