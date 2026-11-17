export interface FaqItem {
  index: number;
  question: string;
  answer: string;
}

export const WHATSAPP_PHONE = '918373069599';
export const WHATSAPP_DEFAULT_MESSAGE =
  'Hi There! Please ask your question here. I am available from 10:30 AM to 5:30 PM.';
export const CHAT_TIMING = 'Chat Timing - 10:30 AM - 5:30 PM (On Official Days)';
export const REVIEW_URL = 'https://www.google.com/search?q=Anudip';
export const HELPLINE_PHONE = '1800-120-5300';
export const SUPPORT_EMAIL = 'info@anudip.org';

export const SUPPORTED_LANGUAGES = [
  'English',
  'Hindi',
  'Bengali',
  'Tamil',
  'Telugu',
  'Marathi',
  'Kannada',
  'Gujarati',
  'Malayalam',
  'Punjabi',
  'Urdu',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const OFFICIAL_FAQS: FaqItem[] = [
  {
    "index": 1,
    "question": "What is the mode of training (Online/Offline/Hybrid)?",
    "answer": "If there is any Hybrid mode option (Online & Offline) is available in your centre then you might get a chance to choose the mode. Please communicate with your trainer regarding it."
  },
  {
    "index": 2,
    "question": "Are the classes live or recorded?",
    "answer": "Basically the classes are live. Both offline and online classes are conducted, however we emphasise on offline/in-person classes."
  },
  {
    "index": 3,
    "question": "May I get the self-study materials from the center once I get enrolled in the course?",
    "answer": "Yes, you will get the study material related to your course from Anudip."
  },
  {
    "index": 4,
    "question": "Can I also get soft skill training along with the course I enrolled for?",
    "answer": "Yes, you can get the soft skill training support with almost all the courses available at Anudip."
  },
  {
    "index": 5,
    "question": "What happens if I miss a session?",
    "answer": "If you miss a session then you can get the recorded classes from your respective trainer. But it depends on the availibility of recordings. In case of unavailibility you have to ask your trainer to brief the previous class again."
  },
  {
    "index": 6,
    "question": "How does Anudip evaluate training effectiveness during the course?",
    "answer": "Anudip evaluates training effectiveness during the course through participant feedback, observation, interactive activities, and ongoing assessments like quizzes and skill demonstrations. This helps trainers adjust content and methods in real-time to ensure learning objectives are being met."
  },
  {
    "index": 7,
    "question": "What if I face any technical issues during the online sessions?",
    "answer": "If you experience technical difficulties during an online class, follow these immediate steps to reconnect: 1. Quick Fixes: Check your internet connection, refresh your browser or app, or restart your device. 2. Notify Your Trainer: Inform your Batch Trainer or Class Coordinator via WhatsApp or phone call so they are aware of your absence/delay."
  },
  {
    "index": 8,
    "question": "Can we get any kit from Anudip after admission?",
    "answer": "Yes! Upon successful admission, students receive a digital student kit along with access to Anudip's learning resources. Depending on your course and center type, your onboarding kit includes: 1.Digital Learning Kit: Access to the Anudip LMS (Learning Management System), which includes self-study content, video tutorials, practice assignments, and software tools required for your course. 2. Course Study Material: E-modules and reference study guides for both technical domain modules and soft skills/communicative English. 3. Student Identity & Credentials: Anudip Student ID/Registration details and login credentials to access online portals, mock tests, and batch updates. Please check with your batch trainer after your orientation to get access to the learning resources."
  },
  {
    "index": 9,
    "question": "Is there any minimum attendance required for certification and placement?",
    "answer": "There is a minimum requirement of 60% or above attendance for certification & placement."
  },
  {
    "index": 10,
    "question": "What would be the eligibility criteria to appear the final assessment and to start with placement ?",
    "answer": "Overall course Level attendance %age ≥ 60%. All self learning assessment / assignment completion on LMS"
  },
  {
    "index": 11,
    "question": "What is the exam/assessment process at Anudip?",
    "answer": "We have two assessment partners. One is external & another is internal. External is Mettl & Internal is LMS. For LMS you will get the link from our internal LMS team. If you have done the exam through Mettl then you will get the link from Mettle directly."
  },
  {
    "index": 12,
    "question": "What is the grading pattern in the assessments/examinations?",
    "answer": "The minimum passing number is 50. According to your number the grade will be reflected on your certificate,Less than or equals to 49 = F, 50 to 59= D, 60 to 69= C, 70 to 79= B, 80 to 89=A & 90 to 100= A+"
  },
  {
    "index": 13,
    "question": "What is the pass marks in the assessment?",
    "answer": "The minimum passing number is 50. According to your number the grade will be reflected on your certificate,Less than or equals to 49 = F, 50 to 59= D, 60 to 69= C, 70 to 79= B, 80 to 89=A & 90 to 100= A+"
  },
  {
    "index": 14,
    "question": "How many days it will take to conduct the final exam after the completion of the course?",
    "answer": "Tentatively it will take 7-10 days after completion of the course to conduct the final examination."
  },
  {
    "index": 15,
    "question": "Will I receive a certificate after completing the course?",
    "answer": "Yes, a certificate is issued after successful course completion and internal assessment, usually within 15-30 working days. You are encouraged to collect it from your training centre"
  },
  {
    "index": 16,
    "question": "Will I get only one certificate from Anudip?",
    "answer": "There are also some specific courses which are eligible for mettl assessment. If you are being enrolled for that very course then you will get a chance to attempt the exam & after completion of your exam will get the both certificate from Anudip & Mettl."
  },
  {
    "index": 17,
    "question": "How long it will take to get the certificate after examination?",
    "answer": "Tentatively it will take 45-60 days after examination to get the certificate."
  },
  {
    "index": 18,
    "question": "From where I could get the certificate?",
    "answer": "You will get your certificate from your respective centre."
  },
  {
    "index": 19,
    "question": "How do I download the course completion certificate?",
    "answer": "After completion of your course if you pass the exam then you will get the certificate from your respective centre."
  },
  {
    "index": 20,
    "question": "How can I check the authenticity of a certificate?",
    "answer": "To check the authenticity of a certificate, verify it directly with the issuing institution through official website, email, or verification portal. Additionally, examine the certificate for security features like logo, QR codes, official seals, or signatures."
  },
  {
    "index": 21,
    "question": "What if I lose my certificate?",
    "answer": "If you lose your certificate then you can reapply for the duplicate certificate with the help of your trainer."
  },
  {
    "index": 22,
    "question": "Will I be able to get the placement support after completion of training and assessments?",
    "answer": "The students should need to complete 50-60% of the module to be eligble for the Placement. Anything less than the specified %, would not be able to sit for the placement drives. Secondly, students into NON_LIVELIHOOD projects are the exceptions, where placement is not provided."
  },
  {
    "index": 23,
    "question": "Will I be able to get placement support if I complete the course but not the exam?",
    "answer": "As per the Company's norm, a student needs to complete the Final Assessment or the END TEST and also needs to Clear the Assessment to get the Placement Support from the CRD."
  },
  {
    "index": 24,
    "question": "Is there any fee to access placement support?",
    "answer": "Absolutely not. There is no need to pay anything for placement support."
  },
  {
    "index": 25,
    "question": "How does Anudip prepare students for placement interviews?",
    "answer": "Anudip prepares students for job interviews by providing training in resume writing, communication skills, and mock interviews to build confidence and readiness. They may also offer industry-specific guidance, dress code tips, and connect students with potential employers for real-world exposure."
  },
  {
    "index": 26,
    "question": "Will I be able to get the mock interview session in our centre?",
    "answer": "Yes, you will definitely get the mock interview session in your centre. Your placement Manager will facilitate through our industry partner or byself."
  },
  {
    "index": 27,
    "question": "How many job opportunities will be provided to each student?",
    "answer": "You will get the maximum Placement support from Anudip till you do"
  },
  {
    "index": 28,
    "question": "What kind of roles or industries will be offered to the students when they get placed?",
    "answer": "Basically we provide the job at IT & ITES industries. So you will get the job opportunity depending on the course which you have done from Anudip."
  },
  {
    "index": 29,
    "question": "What kind of sectors hire through Anudip?",
    "answer": "Anudip often helps to place individuals in sectors like healthcare, retail, hospitality, construction, manufacturing, financial, sales, BPO etc. which offer entry-level or skill-based jobs. These sectors value inclusive hiring and provide on-the-job training, making them ideal for supporting disadvantaged or marginalized job seekers."
  },
  {
    "index": 30,
    "question": "Will I be able to get the job opportunity on my domain?",
    "answer": "You will get various types of opportunities from Anudip. You can take the guidance from your trainer to choose the job."
  },
  {
    "index": 31,
    "question": "What will be the approx salary package if I get the opportunity as a fresher?",
    "answer": "The salary package will always depend on the company & the profile you are being selected for. Regular sessions will be conducted by placement manager during the training period for awareness about various job opportunities covering Salary , Nature of work, Location etc."
  },
  {
    "index": 32,
    "question": "Is there any mandate to relocate for each & every job opportunity or we can get opportunity nearby location also?",
    "answer": "Not at all. You can get the job at your nearby location also. But in some cases if the student stays at interior location & has got the placement at Kolkata then it is not possible for the student to travel on daily basis. In that scenario student needs to relocate."
  },
  {
    "index": 33,
    "question": "In case of relocation can we get the facility of accommodation?",
    "answer": "In some specific projects there is fund for the accommodation only at initial stage. In other cases, you can negotiate with the employer at the interview session (You will get an idea about how to negotiate from your trainer)."
  },
  {
    "index": 34,
    "question": "Will I be able to get the opportunity of work from home?",
    "answer": "If there is any specific requirement for Work from Home from any employer then you may get this opportunity."
  },
  {
    "index": 35,
    "question": "How does Anudip ensure job placements are genuine and safe?",
    "answer": "All placement partners are verified through a due diligence process, and job offers are tracked for compliance, salary standards, and safety."
  },
  {
    "index": 36,
    "question": "Can we get the second job opportunity after leaving the first one?",
    "answer": "Nowadays, getting job is quite tough. So, try to retain the first job as long as you can. Learn the skills, processes, system, understand the working culture. This will enhance your professional abilities & skills to get a proper growth in your career."
  },
  {
    "index": 37,
    "question": "What kind of support does Anudip offer after I get placed?",
    "answer": "Anudip offers post-placement follow-ups, guidance for workplace adaptation, and alumni networking opportunities"
  },
  {
    "index": 38,
    "question": "Can I refer a friend or sibling to enroll in Anudip's courses?",
    "answer": "Yes, referrals are welcome. Your friend can apply by walking in to his/her nearest Anudip training centre"
  },
  {
    "index": 39,
    "question": "How can I become a part of the Anudip Alumni Network?",
    "answer": "All placed candidates are encouraged to join Anudip Alumni Network in social media. Please reach out to your faculty for guidance"
  },
  {
    "index": 40,
    "question": "What if my concern is not listed here ?",
    "answer": "If your question or issue is not listed here, our support team is ready to help you directly. You can reach out through any of the following support channels: 1. Submit a Query: Log into the Anudip Care Portal and click on \"Raise a Ticket\" to submit your specific concern. 2. Contact Your Center: Reach out directly to your assigned Center Coordinator or Batch Trainer. 3. Email Support: Write to us at info@anudip.org with your Student ID, full name, and batch details for a swift resolution. 4.Helpline: Call our student support helpline at 1800-120-5300 during working hours (Monday to Friday, 9:30 AM – 6:00 PM). Our support team typically responds to portal tickets and emails within 24–48 working hours."
  },
  {
    "index": 41,
    "question": "Can you please provide me the Email ID & Contact number of Anudip?",
    "answer": "Contact Information - General Enquiries / Support Email: info@anudip.org Contact Numbers:033 4062 4187 / 033 4060 8484 / 8145111444 Refer to the link for more details: https://anudip.org/contact-us/"
  }
];

export function inferStateFromPinPrefix(pinCode: string): string | null {
  if (pinCode.length < 2) return null;
  const p2 = Number(pinCode.slice(0, 2));
  if (Number.isNaN(p2)) return null;
  if (p2 === 11) return 'Delhi';
  if (p2 === 12 || p2 === 13) return 'Haryana';
  if (p2 >= 14 && p2 <= 16) return 'Punjab';
  if (p2 === 17) return 'Himachal Pradesh';
  if (p2 === 18 || p2 === 19) return 'Jammu and Kashmir';
  if (p2 >= 20 && p2 <= 28) return 'Uttar Pradesh';
  if (p2 >= 30 && p2 <= 34) return 'Rajasthan';
  if (p2 >= 36 && p2 <= 39) return 'Gujarat';
  if (p2 >= 40 && p2 <= 44) return 'Maharashtra';
  if (p2 >= 45 && p2 <= 48) return 'Madhya Pradesh';
  if (p2 === 49) return 'Chhattisgarh';
  if (p2 >= 50 && p2 <= 53) return 'Andhra Pradesh / Telangana';
  if (p2 >= 56 && p2 <= 59) return 'Karnataka';
  if (p2 >= 60 && p2 <= 64) return 'Tamil Nadu';
  if (p2 >= 67 && p2 <= 69) return 'Kerala';
  if (p2 >= 70 && p2 <= 74) return 'West Bengal';
  if (p2 >= 75 && p2 <= 77) return 'Odisha';
  if (p2 === 78) return 'Assam';
  if (p2 === 79) return 'North Eastern States';
  if (p2 >= 80 && p2 <= 85) return 'Bihar / Jharkhand';
  return null;
}
