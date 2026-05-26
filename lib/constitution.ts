export type ConstitutionArticle = {
  number: number;
  title: string;
  text: string;
};

export type ConstitutionChapter = {
  id: string;
  number: string;
  title: string;
  articles: ConstitutionArticle[];
};

export const CONSTITUTION_PREAMBLE =
  "We, the people of Namibia, have solemnly resolved to constitute Namibia as a sovereign, secular, democratic and unitary State securing to all our citizens justice, liberty, equality and fraternity. We the people of Namibia: declare that Namibia is a sovereign, secular, democratic and unitary State founded upon the principles of democracy, social justice and the rule of law; declare our commitment to a society based on freedom and equality; declare our belief that the inherent dignity and the equal and inalienable rights of all members of the human family are indispensable for freedom, justice and peace; declare our commitment to a society in which all persons shall be able to enjoy their fundamental human rights and freedoms; declare our commitment to a society in which all persons shall live together in harmony and peace and shall be provided with the opportunities to develop their own potential; declare our commitment to a society in which the Government and its agencies shall be accountable to the people; declare our commitment to a society in which the Government shall be based on the will of the people and shall maintain and protect their fundamental rights and freedoms; declare our commitment to a society in which the Government shall be based on the will of the people and shall maintain and protect their fundamental rights and freedoms; and adopt this Constitution as the supreme law of the Republic of Namibia.";

export const CONSTITUTION_CHAPTERS: ConstitutionChapter[] = [
  {
    id: "ch1",
    number: "Chapter 1",
    title: "The State and Its Constitutional Principles",
    articles: [
      {
        number: 1,
        title: "Establishment of the Republic of Namibia",
        text: "The Republic of Namibia is hereby established as a sovereign, secular, democratic and unitary State founded upon the principles of democracy, the rule of law and justice for all.",
      },
      {
        number: 2,
        title: "Supremacy of the Constitution",
        text: "This Constitution shall be the supreme law of the Republic of Namibia. All other laws shall be subordinate to it and shall be interpreted in conformity with it.",
      },
      {
        number: 3,
        title: "National Symbols",
        text: "The national symbols of Namibia shall be the National Flag, the National Anthem, the National Coat of Arms and the Seal of the Republic.",
      },
    ],
  },
  {
    id: "ch3",
    number: "Chapter 3",
    title: "Fundamental Human Rights and Freedoms",
    articles: [
      {
        number: 8,
        title: "Dignity",
        text: "The dignity of all persons shall be inviolable.",
      },
      {
        number: 9,
        title: "Slavery and Forced Labour",
        text: "No persons shall be held in slavery or servitude, and no persons shall be required to perform forced labour.",
      },
      {
        number: 10,
        title: "Equality and Freedom from Discrimination",
        text: "All persons shall be equal before the law. No persons may be discriminated against on the grounds of sex, race, colour, ethnic origin, religion, creed or social or economic status.",
      },
      {
        number: 11,
        title: "Life",
        text: "Everyone shall have the right to life. No law may prescribe the death penalty and no court or tribunal shall have the power to impose a sentence of death.",
      },
      {
        number: 12,
        title: "Liberty of the Person",
        text: "All persons shall have the right to liberty and security of the person. No persons shall be subject to arbitrary arrest or detention.",
      },
      {
        number: 13,
        title: "Privacy",
        text: "No persons shall be subject to interference with the privacy of their homes, correspondence or communications save as in accordance with law and as is necessary in a democratic society in the interests of national security, public safety or the economic well-being of the country, for the protection of health or morals, for the prevention of disorder or crime or for the protection of the rights and freedoms of others.",
      },
      {
        number: 14,
        title: "Family",
        text: "Men and women of full age, without any limitation due to race, colour, ethnic origin, nationality, religion, creed or social or economic status shall have the right to marry and to found a family.",
      },
      {
        number: 15,
        title: "Children",
        text: "Children shall have the right from birth to a name, the right to acquire a nationality and, subject to legislation enacted in the best interests of children, to know and be cared for by their parents.",
      },
      {
        number: 16,
        title: "Marriage",
        text: "Nothing contained in Article 14 shall be construed as preventing the Parliament from enacting legislation at any time legislation making provision for the recognition of marriages under any system of law.",
      },
      {
        number: 17,
        title: "Property",
        text: "All persons shall have the right in any part of Namibia to acquire, own and dispose of all forms of property, individually or in association with others.",
      },
      {
        number: 18,
        title: "Administrative Justice",
        text: "Administrative bodies and administrative officials shall act fairly and reasonably and shall comply with the requirements imposed upon such bodies and officials by common law and any relevant legislation.",
      },
      {
        number: 19,
        title: "Culture",
        text: "Every person shall be entitled to enjoy, practice, profess, maintain and promote any culture, language, tradition or religion subject to the terms of this Constitution and further subject to the condition that the rights protected by this Article do not impinge upon the rights of others or the national interest.",
      },
      {
        number: 20,
        title: "Education",
        text: "All persons shall have the right to education. Primary education shall be compulsory and the State shall provide reasonable facilities to render effective this right for every resident within Namibia.",
      },
      {
        number: 21,
        title: "Fundamental Freedoms",
        text: "All persons shall have the right to: freedom of speech and expression, which shall include freedom of the press and other media; freedom to assemble peaceably and without arms; freedom to form and join associations; freedom to petition the Government; freedom to practice any profession, or carry on any occupation, trade or business; freedom to reside and settle in any part of Namibia; freedom to move freely throughout Namibia; freedom to leave and return to Namibia; and freedom to practice any religion and to manifest such practice.",
      },
      {
        number: 22,
        title: "Political Rights",
        text: "Every citizen of Namibia shall have the right to participate in peaceful political activity intended to influence the composition and policies of the Government.",
      },
      {
        number: 23,
        title: "National Security",
        text: "Nothing contained in this Chapter shall be construed as preventing the enactment of legislation making provision for the protection of the national security of Namibia.",
      },
    ],
  },
  {
    id: "ch4",
    number: "Chapter 4",
    title: "Citizenship",
    articles: [
      {
        number: 24,
        title: "Citizenship by Birth or Descent",
        text: "The following persons shall be citizens of Namibia by birth: persons born in Namibia before the date of Independence; and persons born in Namibia after the date of Independence, one of whose parents at the time of the birth is a citizen of Namibia.",
      },
      {
        number: 25,
        title: "Citizenship by Registration",
        text: "The Parliament shall by Act of Parliament make provision for the acquisition of citizenship of Namibia by registration.",
      },
    ],
  },
  {
    id: "ch5",
    number: "Chapter 5",
    title: "The President",
    articles: [
      {
        number: 27,
        title: "Head of State and Government",
        text: "The President shall be the Head of State and of the Government and the Commander-in-Chief of the Defence Force.",
      },
      {
        number: 28,
        title: "Election of President",
        text: "The President shall be elected in accordance with the provisions of this Constitution and in accordance with the provisions of an Act of Parliament regulating the election of the President.",
      },
    ],
  },
  {
    id: "ch6",
    number: "Chapter 6",
    title: "The Executive",
    articles: [
      {
        number: 32,
        title: "Composition of Cabinet",
        text: "There shall be a Cabinet which shall consist of the President, the Prime Minister and such Ministers as the President may appoint from the members of the National Assembly.",
      },
    ],
  },
  {
    id: "ch7",
    number: "Chapter 7",
    title: "The Legislature",
    articles: [
      {
        number: 44,
        title: "Composition of Parliament",
        text: "There shall be a Parliament of Namibia which shall consist of the National Assembly and the National Council.",
      },
      {
        number: 45,
        title: "Legislative Authority",
        text: "The legislative authority of Namibia shall vest in the Parliament.",
      },
    ],
  },
  {
    id: "ch8",
    number: "Chapter 8",
    title: "The Judiciary",
    articles: [
      {
        number: 78,
        title: "Judicial Authority",
        text: "The judicial power of Namibia shall be vested in the Courts of Namibia, which shall consist of a Supreme Court, a High Court and Lower Courts.",
      },
      {
        number: 79,
        title: "Independence of the Judiciary",
        text: "The Courts shall be independent and subject only to this Constitution and the law.",
      },
    ],
  },
  {
    id: "ch9",
    number: "Chapter 9",
    title: "The Ombudsman",
    articles: [
      {
        number: 89,
        title: "Office of the Ombudsman",
        text: "There shall be an Ombudsman, who shall be independent and subject only to this Constitution and the law.",
      },
    ],
  },
  {
    id: "ch10",
    number: "Chapter 10",
    title: "Regional and Local Government",
    articles: [
      {
        number: 102,
        title: "Regional Councils",
        text: "There shall be Regional Councils for the regions of Namibia as determined by Act of Parliament.",
      },
    ],
  },
  {
    id: "ch11",
    number: "Chapter 11",
    title: "Traditional Authorities",
    articles: [
      {
        number: 102,
        title: "Recognition of Traditional Authorities",
        text: "The Government shall recognise and respect the role of traditional authorities in the maintenance of culture and tradition and in the administration of customary law.",
      },
    ],
  },
  {
    id: "ch12",
    number: "Chapter 12",
    title: "Finance",
    articles: [
      {
        number: 125,
        title: "Consolidated Revenue Fund",
        text: "All revenue or moneys raised or received by the Government shall be paid into and form one Consolidated Revenue Fund.",
      },
    ],
  },
  {
    id: "ch13",
    number: "Chapter 13",
    title: "The Public Service",
    articles: [
      {
        number: 112,
        title: "Public Service Commission",
        text: "There shall be a Public Service Commission which shall exercise such functions as may be assigned to it by Act of Parliament.",
      },
    ],
  },
  {
    id: "ch14",
    number: "Chapter 14",
    title: "The Security Services",
    articles: [
      {
        number: 115,
        title: "Defence Force",
        text: "There shall be a Namibian Defence Force which shall be established by Act of Parliament.",
      },
    ],
  },
  {
    id: "ch15",
    number: "Chapter 15",
    title: "Amendment of the Constitution",
    articles: [
      {
        number: 132,
        title: "Amendment Procedure",
        text: "This Constitution shall not be amended unless the proposed amendment is supported by two-thirds of all the members of both Houses of Parliament.",
      },
    ],
  },
];

export function searchConstitution(query: string): Array<{
  chapter: ConstitutionChapter;
  article: ConstitutionArticle;
}> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: Array<{ chapter: ConstitutionChapter; article: ConstitutionArticle }> = [];

  for (const chapter of CONSTITUTION_CHAPTERS) {
    for (const article of chapter.articles) {
      const haystack = `${article.number} ${article.title} ${article.text} ${chapter.title}`.toLowerCase();
      if (haystack.includes(q)) {
        results.push({ chapter, article });
      }
    }
  }

  return results;
}

export const CONSTITUTION_ARTICLE_COUNT = CONSTITUTION_CHAPTERS.reduce(
  (sum, ch) => sum + ch.articles.length,
  0
);
