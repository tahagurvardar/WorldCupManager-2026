import { seededRandom } from '../utils/random.js';

const playerSource = {
  sourceName: 'Manual estimated 2026 candidate squad seed',
  sourceUrl: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/teams',
  verificationStatus: 'estimated',
  lastVerifiedAt: new Date('2026-05-15T00:00:00.000Z'),
};

const knownPlayers = {
  TUR: [
    ['Arda Güler', 'National pool', 21, 'CAM', ['RW', 'CM'], 84],
    ['Hakan Çalhanoğlu', 'National pool', 32, 'CDM', ['CM'], 85],
    ['Kenan Yıldız', 'National pool', 21, 'LW', ['ST'], 82],
    ['Orkun Kökçü', 'National pool', 25, 'CM', ['CAM'], 81],
    ['Uğurcan Çakır', 'National pool', 30, 'GK', [], 80],
    ['Mert Günok', 'National pool', 37, 'GK', [], 78],
    ['Altay Bayındır', 'National pool', 28, 'GK', [], 77],
    ['Zeki Çelik', 'National pool', 29, 'RB', ['RWB'], 78],
    ['Ferdi Kadıoğlu', 'National pool', 26, 'LB', ['LWB', 'CM'], 82],
    ['Çağlar Söyüncü', 'National pool', 30, 'CB', [], 78],
    ['Merih Demiral', 'National pool', 28, 'CB', [], 79],
    ['Abdülkerim Bardakcı', 'National pool', 31, 'CB', [], 77],
    ['Kaan Ayhan', 'National pool', 31, 'CB', ['CDM', 'RB'], 77],
    ['İsmail Yüksek', 'National pool', 27, 'CDM', ['CM'], 78],
    ['Salih Özcan', 'National pool', 28, 'CDM', ['CM'], 77],
    ['Kerem Aktürkoğlu', 'National pool', 27, 'LW', ['RW'], 80],
    ['Barış Alper Yılmaz', 'National pool', 26, 'RW', ['ST', 'LW'], 80],
    ['Yunus Akgün', 'National pool', 26, 'RW', ['CAM'], 78],
    ['Cengiz Ünder', 'National pool', 28, 'RW', ['LW'], 77],
    ['Can Uzun', 'National pool', 20, 'CAM', ['ST'], 79],
    ['Semih Kılıçsoy', 'National pool', 21, 'ST', ['LW'], 78],
    ['Enes Ünal', 'National pool', 29, 'ST', [], 79],
    ['Ozan Kabak', 'National pool', 26, 'CB', [], 77],
    ['İrfan Can Kahveci', 'National pool', 30, 'CAM', ['RW'], 78],
  ],
  ARG: [
    ['Lionel Messi', 'Inter Miami', 38, 'RW', ['CAM', 'ST'], 88],
    ['Lautaro Martínez', 'Inter', 28, 'ST', [], 86],
    ['Julián Álvarez', 'Atlético Madrid', 26, 'ST', ['RW'], 85],
    ['Enzo Fernández', 'Chelsea', 25, 'CM', ['CDM'], 84],
    ['Emiliano Martínez', 'Aston Villa', 33, 'GK', [], 85],
  ],
  FRA: [
    ['Kylian Mbappé', 'Real Madrid', 27, 'ST', ['LW'], 91],
    ['Ousmane Dembélé', 'Paris Saint-Germain', 29, 'RW', ['LW'], 86],
    ['William Saliba', 'Arsenal', 25, 'CB', [], 86],
    ['Aurélien Tchouaméni', 'Real Madrid', 26, 'CDM', ['CB'], 85],
    ['Mike Maignan', 'Milan', 30, 'GK', [], 86],
  ],
  ENG: [
    ['Harry Kane', 'Bayern München', 32, 'ST', [], 90],
    ['Jude Bellingham', 'Real Madrid', 22, 'CAM', ['CM'], 90],
    ['Bukayo Saka', 'Arsenal', 24, 'RW', ['LW'], 87],
    ['Declan Rice', 'Arsenal', 27, 'CDM', ['CM'], 87],
    ['Jordan Pickford', 'Everton', 32, 'GK', [], 82],
  ],
  BRA: [
    ['Vinícius Júnior', 'Real Madrid', 25, 'LW', ['ST'], 90],
    ['Rodrygo', 'Real Madrid', 25, 'RW', ['ST'], 86],
    ['Raphinha', 'Barcelona', 29, 'RW', ['LW'], 86],
    ['Alisson Becker', 'Liverpool', 33, 'GK', [], 88],
    ['Marquinhos', 'Paris Saint-Germain', 32, 'CB', [], 85],
  ],
  ESP: [
    ['Lamine Yamal', 'Barcelona', 18, 'RW', ['LW'], 88],
    ['Pedri', 'Barcelona', 23, 'CM', ['CAM'], 87],
    ['Rodri', 'Manchester City', 29, 'CDM', ['CM'], 90],
    ['Nico Williams', 'Athletic Club', 23, 'LW', ['RW'], 84],
    ['Unai Simón', 'Athletic Club', 28, 'GK', [], 83],
  ],
  POR: [
    ['Cristiano Ronaldo', 'Al Nassr', 41, 'ST', [], 84],
    ['Bruno Fernandes', 'Manchester United', 31, 'CAM', ['CM'], 87],
    ['Bernardo Silva', 'Manchester City', 31, 'RW', ['CM'], 86],
    ['Vitinha', 'Paris Saint-Germain', 26, 'CM', ['CDM'], 86],
    ['Diogo Costa', 'Porto', 26, 'GK', [], 84],
  ],
  GER: [
    ['Jamal Musiala', 'Bayern München', 23, 'CAM', ['LW'], 88],
    ['Florian Wirtz', 'Bayer Leverkusen', 23, 'CAM', ['RW'], 88],
    ['Joshua Kimmich', 'Bayern München', 31, 'CDM', ['RB'], 86],
    ['Kai Havertz', 'Arsenal', 27, 'ST', ['CAM'], 84],
    ['Antonio Rüdiger', 'Real Madrid', 33, 'CB', [], 85],
  ],
  NED: [
    ['Virgil van Dijk', 'Liverpool', 34, 'CB', [], 87],
    ['Frenkie de Jong', 'Barcelona', 29, 'CM', ['CDM'], 86],
    ['Cody Gakpo', 'Liverpool', 27, 'LW', ['ST'], 84],
    ['Xavi Simons', 'RB Leipzig', 23, 'CAM', ['RW'], 84],
    ['Bart Verbruggen', 'Brighton', 23, 'GK', [], 80],
  ],
  BEL: [
    ['Kevin De Bruyne', 'Napoli', 34, 'CM', ['CAM'], 86],
    ['Jérémy Doku', 'Manchester City', 23, 'LW', ['RW'], 84],
    ['Romelu Lukaku', 'Napoli', 33, 'ST', [], 83],
    ['Thibaut Courtois', 'Real Madrid', 34, 'GK', [], 88],
    ['Youri Tielemans', 'Aston Villa', 29, 'CM', ['CDM'], 81],
  ],
  USA: [
    ['Christian Pulisic', 'Milan', 27, 'LW', ['RW'], 83],
    ['Weston McKennie', 'Juventus', 27, 'CM', ['RM'], 80],
    ['Tyler Adams', 'Bournemouth', 27, 'CDM', [], 78],
    ['Gio Reyna', 'Borussia Dortmund', 23, 'CAM', ['RW'], 79],
    ['Matt Turner', 'Nottingham Forest', 31, 'GK', [], 76],
  ],
  CAN: [
    ['Alphonso Davies', 'Bayern München', 25, 'LB', ['LW'], 84],
    ['Jonathan David', 'Juventus', 26, 'ST', [], 83],
    ['Tajon Buchanan', 'Inter', 27, 'RW', ['RWB'], 77],
  ],
  KOR: [
    ['Son Heung-min', 'Tottenham Hotspur', 33, 'LW', ['ST'], 86],
    ['Kim Min-jae', 'Bayern München', 29, 'CB', [], 84],
    ['Lee Kang-in', 'Paris Saint-Germain', 25, 'CAM', ['RW'], 80],
  ],
  JPN: [
    ['Takefusa Kubo', 'Real Sociedad', 24, 'RW', ['CAM'], 82],
    ['Kaoru Mitoma', 'Brighton', 28, 'LW', [], 81],
    ['Wataru Endo', 'Liverpool', 33, 'CDM', ['CM'], 79],
  ],
  MAR: [
    ['Achraf Hakimi', 'Paris Saint-Germain', 27, 'RB', ['RWB'], 86],
    ['Yassine Bounou', 'Al Hilal', 35, 'GK', [], 83],
    ['Sofyan Amrabat', 'Fenerbahçe', 29, 'CDM', ['CM'], 80],
  ],
  URU: [
    ['Federico Valverde', 'Real Madrid', 27, 'CM', ['RW'], 88],
    ['Darwin Núñez', 'Liverpool', 26, 'ST', ['LW'], 84],
    ['Ronald Araújo', 'Barcelona', 27, 'CB', ['RB'], 86],
  ],
  COL: [
    ['Luis Díaz', 'Liverpool', 29, 'LW', ['RW'], 86],
    ['James Rodríguez', 'León', 34, 'CAM', ['RW'], 78],
    ['Jhon Durán', 'Al Nassr', 22, 'ST', [], 80],
  ],
  CRO: [
    ['Luka Modrić', 'Milan', 40, 'CM', ['CAM'], 82],
    ['Joško Gvardiol', 'Manchester City', 24, 'CB', ['LB'], 86],
    ['Andrej Kramarić', 'Hoffenheim', 34, 'ST', ['CAM'], 80],
  ],
  NOR: [
    ['Erling Haaland', 'Manchester City', 25, 'ST', [], 91],
    ['Martin Ødegaard', 'Arsenal', 27, 'CAM', ['CM'], 88],
    ['Alexander Sørloth', 'Atlético Madrid', 30, 'ST', [], 81],
  ],
  EGY: [
    ['Mohamed Salah', 'Liverpool', 33, 'RW', ['ST'], 88],
    ['Omar Marmoush', 'Manchester City', 27, 'ST', ['LW'], 82],
    ['Mohamed Elneny', 'Al Jazira', 33, 'CDM', ['CM'], 75],
  ],
  SEN: [
    ['Sadio Mané', 'Al Nassr', 34, 'LW', ['ST'], 83],
    ['Kalidou Koulibaly', 'Al Hilal', 34, 'CB', [], 81],
    ['Nicolas Jackson', 'Chelsea', 25, 'ST', [], 81],
  ],
  SWE: [
    ['Alexander Isak', 'Newcastle United', 26, 'ST', [], 86],
    ['Dejan Kulusevski', 'Tottenham Hotspur', 26, 'RW', ['CAM'], 83],
    ['Viktor Gyökeres', 'Arsenal', 28, 'ST', [], 85],
  ],
};

const formationPool = [
  ['GK', 3],
  ['RB', 2],
  ['CB', 5],
  ['LB', 2],
  ['CDM', 2],
  ['CM', 4],
  ['CAM', 2],
  ['RW', 2],
  ['LW', 2],
  ['ST', 4],
  ['RM', 1],
  ['LM', 1],
];

const countryNamePools = {
  ALG: [['Riyad', 'Ismaël', 'Youcef', 'Farès', 'Houssem', 'Amine', 'Yacine', 'Sofiane'], ['Bennacer', 'Belkebla', 'Mandi', 'Slimani', 'Aouar', 'Atal', 'Mahrez', 'Zerrouki']],
  ARG: [['Nicolás', 'Thiago', 'Enzo', 'Lautaro', 'Julián', 'Emiliano', 'Alexis', 'Facundo'], ['Fernández', 'Martínez', 'Romero', 'Alvarez', 'Mac Allister', 'Otamendi', 'Molina', 'González']],
  AUS: [['Jackson', 'Connor', 'Mitchell', 'Riley', 'Cameron', 'Aiden', 'Jordan', 'Lachlan'], ['Irvine', 'Souttar', 'Goodwin', 'Atkinson', 'Burgess', 'McGree', 'Ryan', 'Metcalfe']],
  AUT: [['Marcel', 'Florian', 'Christoph', 'Michael', 'Stefan', 'Patrick', 'Konrad', 'Nicolas'], ['Sabitzer', 'Laimer', 'Baumgartner', 'Danso', 'Posch', 'Lienhart', 'Gregoritsch', 'Wimmer']],
  BEL: [['Kevin', 'Youri', 'Jérémy', 'Amadou', 'Arthur', 'Loïs', 'Charles', 'Zeno'], ['De Bruyne', 'Tielemans', 'Doku', 'Onana', 'Theate', 'Openda', 'De Ketelaere', 'Debast']],
  BIH: [['Amar', 'Edin', 'Miralem', 'Anel', 'Haris', 'Benjamin', 'Sead', 'Ermedin'], ['Džeko', 'Pjanić', 'Ahmedhodžić', 'Hadžiahmetović', 'Tahirović', 'Kolašinac', 'Demirović', 'Gazibegović']],
  BRA: [['Vinícius', 'Rodrygo', 'Gabriel', 'Lucas', 'João', 'Bruno', 'Endrick', 'Matheus'], ['Silva', 'Santos', 'Pereira', 'Oliveira', 'Marquinhos', 'Guimarães', 'Militão', 'Paquetá']],
  CAN: [['Alphonso', 'Jonathan', 'Tajon', 'Stephen', 'Ismaël', 'Cyle', 'Moïse', 'Richie'], ['Davies', 'David', 'Buchanan', 'Eustáquio', 'Koné', 'Larin', 'Bombito', 'Laryea']],
  CIV: [['Sébastien', 'Franck', 'Evan', 'Oumar', 'Ibrahim', 'Simon', 'Wilfried', 'Jean'], ['Haller', 'Kessié', 'Ndicka', 'Diakité', 'Sangaré', 'Adingra', 'Zaha', 'Seri']],
  COD: [['Yoane', 'Chancel', 'Cédric', 'Silas', 'Meschack', 'Samuel', 'Arthur', 'Gaël'], ['Wissa', 'Mbemba', 'Bakambu', 'Katompa', 'Elia', 'Moutoussamy', 'Masuaku', 'Kakuta']],
  COL: [['Luis', 'James', 'Jhon', 'Daniel', 'Davinson', 'Jefferson', 'Yerry', 'Rafael'], ['Díaz', 'Rodríguez', 'Durán', 'Muñoz', 'Sánchez', 'Lerma', 'Mina', 'Borré']],
  CPV: [['Ryan', 'Bebé', 'Jovane', 'Garry', 'Logan', 'Jamiro', 'Dylan', 'Kevin'], ['Mendes', 'Tavares', 'Cabral', 'Rodrigues', 'Costa', 'Monteiro', 'Varela', 'Semedo']],
  CRO: [['Luka', 'Mateo', 'Andrej', 'Joško', 'Marcelo', 'Lovro', 'Martin', 'Dominik'], ['Modrić', 'Kovačić', 'Kramarić', 'Gvardiol', 'Brozović', 'Majer', 'Baturina', 'Livaković']],
  CUW: [['Leandro', 'Juninho', 'Rangelo', 'Jeremy', 'Brandley', 'Vurnon', 'Kenji', 'Jearl'], ['Bacuna', 'Martina', 'Janga', 'Antonisse', 'Kuwas', 'Anita', 'Gorré', 'Margaritha']],
  CZE: [['Tomáš', 'Patrik', 'Antonín', 'Ladislav', 'Adam', 'Lukáš', 'Václav', 'David'], ['Souček', 'Schick', 'Barák', 'Krejčí', 'Hložek', 'Provod', 'Černý', 'Jurásek']],
  ECU: [['Moisés', 'Piero', 'Pervis', 'Kendry', 'Gonzalo', 'Willian', 'Ángel', 'Alan'], ['Caicedo', 'Hincapié', 'Estupiñán', 'Páez', 'Plata', 'Pacho', 'Preciado', 'Franco']],
  EGY: [['Mohamed', 'Omar', 'Mostafa', 'Ahmed', 'Mahmoud', 'Hamdi', 'Trezeguet', 'Marwan'], ['Salah', 'Marmoush', 'Mohamed', 'Hegazy', 'Hamdy', 'Fathy', 'Elneny', 'Attia']],
  ENG: [['Harry', 'Jude', 'Bukayo', 'Declan', 'Phil', 'Cole', 'Marcus', 'Trent'], ['Kane', 'Bellingham', 'Saka', 'Rice', 'Foden', 'Palmer', 'Rashford', 'Alexander-Arnold']],
  ESP: [['Lamine', 'Pedri', 'Rodri', 'Nico', 'Álvaro', 'Dani', 'Fabián', 'Unai'], ['Yamal', 'González', 'Hernández', 'Williams', 'Morata', 'Olmo', 'Ruiz', 'Simón']],
  FRA: [['Kylian', 'Ousmane', 'Aurélien', 'Eduardo', 'William', 'Theo', 'Mike', 'Marcus'], ['Mbappé', 'Dembélé', 'Tchouaméni', 'Camavinga', 'Saliba', 'Hernández', 'Maignan', 'Thuram']],
  GER: [['Jamal', 'Florian', 'Joshua', 'Kai', 'Antonio', 'Leroy', 'Niclas', 'Jonathan'], ['Musiala', 'Wirtz', 'Kimmich', 'Havertz', 'Rüdiger', 'Sané', 'Füllkrug', 'Tah']],
  GHA: [['Mohammed', 'Thomas', 'Jordan', 'Antoine', 'Ernest', 'Iñaki', 'Alexander', 'Daniel'], ['Kudus', 'Partey', 'Ayew', 'Semenyo', 'Nuamah', 'Williams', 'Djiku', 'Amartey']],
  HAI: [['Frantzdy', 'Duckens', 'Wilde-Donald', 'Jean', 'Carl', 'Bryan', 'Leverton', 'Ricardo'], ['Pierrot', 'Nazon', 'Guerrier', 'Jacques', 'Sainte', 'Alceus', 'Pierre', 'Adé']],
  IRN: [['Mehdi', 'Sardar', 'Alireza', 'Saman', 'Saeid', 'Hossein', 'Milad', 'Ehsan'], ['Taremi', 'Azmoun', 'Jahanbakhsh', 'Ghoddos', 'Ezatzolahi', 'Kanaanizadegan', 'Mohammadi', 'Hajsafi']],
  IRQ: [['Aymen', 'Ali', 'Hussein', 'Ibrahim', 'Bashar', 'Amjad', 'Zidane', 'Mohannad'], ['Hussein', 'Adnan', 'Ali', 'Bayesh', 'Resan', 'Attwan', 'Iqbal', 'Jassim']],
  JOR: [['Musa', 'Yazan', 'Baha', 'Nizar', 'Mahmoud', 'Ibrahim', 'Ali', 'Anas'], ['Al-Taamari', 'Al-Naimat', 'Faisal', 'Al-Rawabdeh', 'Mardi', 'Sadeh', 'Olwan', 'Bani Yaseen']],
  JPN: [['Takefusa', 'Kaoru', 'Wataru', 'Ritsu', 'Daichi', 'Ao', 'Ko', 'Ayase'], ['Kubo', 'Mitoma', 'Endo', 'Doan', 'Kamada', 'Tanaka', 'Itakura', 'Ueda']],
  KOR: [['Heung-min', 'Min-jae', 'Kang-in', 'Hee-chan', 'Ui-jo', 'Jae-sung', 'Woo-young', 'Seung-gyu'], ['Son', 'Kim', 'Lee', 'Hwang', 'Cho', 'Jung', 'Park', 'Song']],
  KSA: [['Salem', 'Firas', 'Saleh', 'Mohamed', 'Abdulelah', 'Saud', 'Hassan', 'Nasser'], ['Al-Dawsari', 'Al-Buraikan', 'Al-Shehri', 'Kanno', 'Al-Malki', 'Abdulhamid', 'Tambakti', 'Al-Dosari']],
  MAR: [['Achraf', 'Yassine', 'Sofyan', 'Hakim', 'Youssef', 'Nayef', 'Azzedine', 'Amine'], ['Hakimi', 'Bounou', 'Amrabat', 'Ziyech', 'En-Nesyri', 'Aguerd', 'Ounahi', 'Harit']],
  MEX: [['Santiago', 'Hirving', 'Edson', 'Luis', 'Julián', 'César', 'Uriel', 'Jorge'], ['Giménez', 'Lozano', 'Álvarez', 'Chávez', 'Quiñones', 'Montes', 'Antuna', 'Sánchez']],
  NED: [['Virgil', 'Frenkie', 'Cody', 'Xavi', 'Denzel', 'Matthijs', 'Ryan', 'Bart'], ['van Dijk', 'de Jong', 'Gakpo', 'Simons', 'Dumfries', 'de Ligt', 'Gravenberch', 'Verbruggen']],
  NOR: [['Erling', 'Martin', 'Alexander', 'Sander', 'Antonio', 'Julian', 'Kristoffer', 'Leo'], ['Haaland', 'Ødegaard', 'Sørloth', 'Berge', 'Nusa', 'Ryerson', 'Ajer', 'Østigård']],
  NZL: [['Chris', 'Winston', 'Sarpreet', 'Liberato', 'Joe', 'Callum', 'Nando', 'Ben'], ['Wood', 'Reid', 'Singh', 'Cacace', 'Bell', 'McCowatt', 'Pijnaker', 'Waine']],
  PAN: [['Adalberto', 'Aníbal', 'Cecilio', 'Édgar', 'José', 'Michael', 'Fidel', 'Yoel'], ['Carrera', 'Godoy', 'Waterman', 'Bárcenas', 'Córdoba', 'Murillo', 'Escobar', 'Bárcenas']],
  PAR: [['Miguel', 'Julio', 'Ramón', 'Matías', 'Gustavo', 'Omar', 'Fabián', 'Diego'], ['Almirón', 'Enciso', 'Sosa', 'Villasanti', 'Gómez', 'Alderete', 'Balbuena', 'Gómez']],
  POR: [['Cristiano', 'Bruno', 'Bernardo', 'Vitinha', 'Diogo', 'João', 'Rafael', 'Rúben'], ['Ronaldo', 'Fernandes', 'Silva', 'Ferreira', 'Costa', 'Cancelo', 'Leão', 'Dias']],
  QAT: [['Akram', 'Almoez', 'Hassan', 'Abdulaziz', 'Boualem', 'Pedro', 'Assim', 'Tarek'], ['Afif', 'Ali', 'Al-Haydos', 'Hatem', 'Khoukhi', 'Miguel', 'Madibo', 'Salman']],
  RSA: [['Percy', 'Themba', 'Teboho', 'Ronwen', 'Mothobi', 'Aubrey', 'Evidence', 'Thapelo'], ['Tau', 'Zwane', 'Mokoena', 'Williams', 'Mvala', 'Modiba', 'Makgopa', 'Morena']],
  SCO: [['Andrew', 'Scott', 'John', 'Billy', 'Kieran', 'Che', 'Ryan', 'Lewis'], ['Robertson', 'McTominay', 'McGinn', 'Gilmour', 'Tierney', 'Adams', 'Christie', 'Ferguson']],
  SEN: [['Sadio', 'Kalidou', 'Nicolas', 'Ismaïla', 'Idrissa', 'Pape', 'Boulaye', 'Habib'], ['Mané', 'Koulibaly', 'Jackson', 'Sarr', 'Gueye', 'Matar Sarr', 'Dia', 'Diallo']],
  SUI: [['Granit', 'Manuel', 'Breel', 'Xherdan', 'Noah', 'Zeki', 'Remo', 'Ruben'], ['Xhaka', 'Akanji', 'Embolo', 'Shaqiri', 'Okafor', 'Amdouni', 'Freuler', 'Vargas']],
  SWE: [['Alexander', 'Dejan', 'Viktor', 'Emil', 'Anthony', 'Isak', 'Hugo', 'Robin'], ['Isak', 'Kulusevski', 'Gyökeres', 'Forsberg', 'Elanga', 'Hien', 'Larsson', 'Olsen']],
  TUN: [['Ellyes', 'Youssef', 'Hannibal', 'Aïssa', 'Ali', 'Hamza', 'Mohamed', 'Wajdi'], ['Skhiri', 'Msakni', 'Mejbri', 'Laïdouni', 'Abdi', 'Rafia', 'Dhaoui', 'Kechrida']],
  TUR: [['Arda', 'Hakan', 'Kenan', 'Orkun', 'Kerem', 'Barış', 'İsmail', 'Ferdi'], ['Güler', 'Çalhanoğlu', 'Yıldız', 'Kökçü', 'Aktürkoğlu', 'Yılmaz', 'Yüksek', 'Kadıoğlu']],
  URU: [['Federico', 'Darwin', 'Ronald', 'Rodrigo', 'Manuel', 'Facundo', 'Giorgian', 'Sergio'], ['Valverde', 'Núñez', 'Araújo', 'Bentancur', 'Ugarte', 'Pellistri', 'de Arrascaeta', 'Rochet']],
  USA: [['Christian', 'Weston', 'Tyler', 'Gio', 'Yunus', 'Timothy', 'Folarin', 'Matt'], ['Pulisic', 'McKennie', 'Adams', 'Reyna', 'Musah', 'Weah', 'Balogun', 'Turner']],
  UZB: [['Eldor', 'Abbostbek', 'Jaloliddin', 'Odiljon', 'Oston', 'Fayzulla', 'Rustam', 'Utkir'], ['Shomurodov', 'Fayzullayev', 'Masharipov', 'Hamrobekov', 'Urunov', 'Sayfiyev', 'Ashurmatov', 'Yusupov']],
};

const firstNames = [
  'Emir', 'Mateo', 'Lucas', 'Yusuf', 'Nicolás', 'Daniel', 'Samir', 'Milan', 'Leo', 'Rayan',
  'Kaito', 'Ivan', 'Noah', 'Amir', 'Diego', 'Tariq', 'Oscar', 'Thiago', 'Adam', 'Bruno',
  'João', 'Moussa', 'Elias', 'Victor', 'Ali', 'Samuel', 'Marco', 'Kenji', 'David', 'Omar',
];

const lastNames = [
  'Silva', 'Yılmaz', 'Khan', 'Nakamura', 'Garcia', 'Demir', 'Johnson', 'Mensah', 'Diallo', 'Novak',
  'Santos', 'Hassan', 'Park', 'Moreira', 'Davies', 'Kovač', 'Aydin', 'Mendoza', 'Okafor', 'Kim',
  'Ferreira', 'Benali', 'Williams', 'Schmidt', 'Valdez', 'Bakker', 'Haddad', 'Campbell', 'Mori', 'Sow',
];

function positionAttributes(position, overall, rand) {
  const base = () => Math.round(overall - 8 + rand() * 16);
  const attrs = {
    pace: base(),
    shooting: base(),
    passing: base(),
    dribbling: base(),
    defending: base(),
    physical: base(),
  };

  if (position === 'GK') {
    attrs.shooting = Math.max(22, overall - 38);
    attrs.defending = overall;
    attrs.physical = overall - 4;
  }
  if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM'].includes(position)) attrs.defending = Math.min(99, overall + 5);
  if (['ST', 'LW', 'RW'].includes(position)) attrs.shooting = Math.min(99, overall + 4);
  if (['CM', 'CAM', 'CDM'].includes(position)) attrs.passing = Math.min(99, overall + 5);
  if (['LW', 'RW', 'CAM'].includes(position)) attrs.dribbling = Math.min(99, overall + 5);

  return attrs;
}

function secondaryFor(position) {
  const map = {
    GK: [],
    RB: ['RWB', 'CB'],
    LB: ['LWB', 'CB'],
    CB: ['RB', 'LB'],
    CDM: ['CM', 'CB'],
    CM: ['CDM', 'CAM'],
    CAM: ['CM', 'RW', 'LW'],
    RW: ['RM', 'ST'],
    LW: ['LM', 'ST'],
    RM: ['RW', 'CM'],
    LM: ['LW', 'CM'],
    ST: ['LW', 'RW'],
  };
  return map[position] || [];
}

function generatedName(team, rand) {
  const pool = countryNamePools[team.fifaCode];
  if (!pool) {
    return `${firstNames[Math.floor(rand() * firstNames.length)]} ${lastNames[Math.floor(rand() * lastNames.length)]}`;
  }

  const [givenNames, familyNames] = pool;
  return `${givenNames[Math.floor(rand() * givenNames.length)]} ${familyNames[Math.floor(rand() * familyNames.length)]}`;
}

function makeGeneratedPlayer(team, index, position, rand) {
  const rankBand = team.worldRanking <= 10 ? 80 : team.worldRanking <= 25 ? 76 : team.worldRanking <= 45 ? 72 : 67;
  const age = Math.round(19 + rand() * 14);
  const overall = Math.round(rankBand - index * 0.18 + rand() * 9);
  const fullName = generatedName(team, rand);

  return {
    fullName,
    fifaCode: team.fifaCode,
    club: 'National pool',
    age,
    primaryPosition: position,
    secondaryPositions: secondaryFor(position),
    overall: Math.max(54, Math.min(88, overall)),
    potential: Math.max(58, Math.min(92, overall + Math.round(rand() * 7))),
    nationalTeamStatus: index < 26 ? 'provisional' : 'candidate',
    sourceMetadata: playerSource,
  };
}

export function buildPlayerSeeds(teams) {
  return teams.flatMap((team) => {
    const rand = seededRandom(`players-${team.fifaCode}`);
    const known = (knownPlayers[team.fifaCode] || []).map(([fullName, , age, primaryPosition, secondaryPositions, overall]) => ({
      fullName,
      fifaCode: team.fifaCode,
      club: 'National pool',
      age,
      primaryPosition,
      secondaryPositions,
      overall,
      potential: Math.min(99, overall + Math.round(rand() * 4)),
      nationalTeamStatus: 'provisional',
      sourceMetadata: playerSource,
    }));

    const generated = [];
    formationPool.forEach(([position, count]) => {
      for (let slot = 0; slot < count; slot += 1) {
        generated.push(makeGeneratedPlayer(team, generated.length + known.length, position, rand));
      }
    });

    return [...known, ...generated].slice(0, 30).map((player, index) => ({
      ...player,
      attributes: positionAttributes(player.primaryPosition, player.overall, rand),
      dynamic: {
        morale: Math.round(48 + rand() * 18),
        form: Math.round(45 + rand() * 32),
        fitness: Math.round(80 + rand() * 18),
        fatigue: Math.round(8 + rand() * 20),
      },
      tournamentStats: {
        goals: 0,
        assists: 0,
        appearances: 0,
        yellowCards: 0,
        redCards: 0,
        avgRating: 6.5,
      },
      injury: {
        injuryStatus: rand() > 0.95 ? 'minor' : 'fit',
        injuryType: rand() > 0.95 ? 'Muscle tightness' : '',
        injuryDays: rand() > 0.95 ? Math.round(2 + rand() * 8) : 0,
      },
      nationalTeamStatus: index < 26 ? player.nationalTeamStatus : 'candidate',
    }));
  });
}
