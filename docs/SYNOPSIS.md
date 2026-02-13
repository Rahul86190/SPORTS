# SPORTS
**(Student Portal for Opportunities, Resources, Tutoring & Success)**

## SYNOPSIS
### OF MAJOR PROJECT

**BACHELOR OF TECHNOLOGY**

**IN**
**ARTIFICIAL INTELLIGENCE AND DATA SCIENCE**

**SUBMITTED BY**

- **Rahul Saini (22EAIAD090)**
- **[Name 2] ([Roll No.])**
- **[Name 3] ([Roll No.])**
- **[Name 4] ([Roll No.])**

**ARYA COLLEGE OF ENGINEERING, JAIPUR**
**MAY 2026**

---

### 1. Introduction
In the contemporary era of rapid technological advancement, the alignment between academic curricula and industry requirements has become increasingly critical. Students pursuing technical degrees often find themselves in a challenging position where theoretical knowledge alone remains insufficient for securing competitive roles in the software industry. The gap between institutional learning and market demands is widening, necessitating a proactive approach to skill acquisition and career management.

"SPORTS" (Student Portal for Opportunities, Resources, Tutoring & Success) is conceived as a holistic solution to this pervasive issue. It is not merely a job board but an intelligent, data-driven ecosystem designed to empower students to take ownership of their professional growth. The platform integrates distinct functionalities—skill tracking, opportunity aggregation, and personalized roadmap generation—into a cohesive user experience. By leveraging modern web technologies and Generative AI, SPORTS provides a dynamic feedback loop: students input their current capabilities, and the system acts as a mentor, suggesting precise steps to bridge the gap to their desired roles.

The need for such a system stems from the fragmented nature of current career development tools. While platforms like LinkedIn facilitate networking, and portals like Internshala focus on specific opportunities, there is a distinct lack of a centralized mechanism that 'verifies' a student's claim to competence and guides them through the granular steps of upskilling. SPORTS addresses this by parsing resumes to extract verifiable skills, initiating adaptive assessments, and curating a feed of hackathons and internships that are strictly relevant to the student's current proficiency level.

Furthermore, the project emphasizes the importance of 'verified profiles.' in an industry plagued by inflated resumes, SPORTS aims to create a record of trust. By tracking a student's participation in hackathons, completion of daily learning sprints, and performance in adaptive tests, the platform builds a 'Live Portfolio' that speaks louder than a static document. This final year project represents a synthesis of advanced software engineering principles, employing a microservices-inspired architecture to deliver a scalable, responsive, and impactful tool for the student community.

### 2. Objectives
The primary objective of the SPORTS project is to architect a unified career acceleration platform that enables students to systematically track their academic and technical progress. Specifically, the system aims to deploy an AI-driven engine for resume parsing and personalized learning path generation, aggregate real-time opportunities (internships, jobs, hackathons) from disparate sources, and establish a verification mechanism for student skills. The ultimate goal is to reduce the information asymmetry between learning resources and industry expectations, fostering a culture of continuous, data-backed professional development.

### 3. Literature Review

**1. LinkedIn and Professional Networking Platforms:**
Research into social professional networks reveals that while they excel at connecting individuals, they often lack structured, pedagogical guidance for students. A study on 'The Efficacy of Social Recruitment' suggests that entry-level candidates frequently struggle to highlight relevant skills amidst the noise of general networking. SPORTS differentiates itself by focusing specifically on the 'preparation' phase rather than just the 'application' phase.

**2. Existing Gig and Internship Portals (e.g., Internshala, Naukri):**
Analysis of existing aggregation platforms indicates a high volume of listings but low relevance filtering for specific student skill sets. Users often report 'application fatigue' due to poor matching algorithms. Our review suggests that a pre-filtering mechanism based on verified technical skills—as proposed in SPORTS—can significantly improve the match rate and reduce wasted effort for both applicants and recruiters.

**3. AI in Education and Career Guidance:**
Recent literature on Large Language Models (LLMs) demonstrates their efficacy in analyzing unstructured text (resumes) and generating learning taxonomies. Systems utilizing NLP for curriculum recommendation have shown a 40% increase in learner engagement compared to static rule-based systems. Incorporating Gemini AI into SPORTS builds upon these findings to offer dynamic, context-aware roadmaps.

**4. Gamification in Learning Management Systems:**
Studies on student engagement highlight the effectiveness of streak tracking and progress visualization. By treating career preparation as a measurable, gamified process (daily sprints, skill badges), SPORTS adopts proven pedagogical strategies to maintain long-term user retention and motivation.

### 4. Feasibility Study

**Technical Feasibility:**
The project relies on mature, open-source technologies (Next.js, FastAPI, PostgreSQL) which are well-documented and widely supported. The integration of Google's Gemini API poses a moderate learning curve but is feasible given the team's expertise in Python. The rigorous separation of frontend and backend ensures that the system works efficiently on standard student hardware.

**Operational Feasibility:**
The system is designed to be self-sustaining. Web scrapers are automated to fetch data without manual intervention. The user interface focuses on minimalism and usability, ensuring that students require no training to use the platform. Deployment on cloud platforms like Vercel and Render ensures $0 initial infrastructure cost, making it operationally viable for a college project.

**Economic Feasibility:**
Development costs are primarily time and effort, as all chosen software tools have free tiers for development. The potential value—improving placement rates and student upskilling—far outweighs the negligible operational costs. It is a high-impact, low-cost solution suitable for academic implementation.

### 5. Methodology and Planning of Work
The development of SPORTS follows the Agile Software Development Life Cycle (SDLC), ensuring iterative improvement and continuous feedback. The methodology is structured into distinct phases:

- **Phase 1: Requirement Analysis and Design**
  Gathering detailed requirements, designing the database schema (ER Diagrams), and creating high-fidelity UI/UX prototypes in Figma. Defining the API specifications for client-server communication.

- **Phase 2: Frontend Development (Client Side)**
  Implementing the Next.js application. Developing reusable components (Navbar, SkillSelector, Dashboard). Integrating Tailwind CSS for responsive design and Framer Motion for interactive elements.

- **Phase 3: Backend & Database Implementation**
  Setting up the FastAPI server. Implementing JWT authentication. Configuring Supabase (PostgreSQL) tables for Users, Skills, and Opportunities. Developing web scrapers for data aggregation.

- **Phase 4: AI Module Integration**
  Integrating the Gemini AI API. Developing the Resume Parser logic to extract JSON data from documents. Implementing the 'Roadmap Generator' prompt engineering strategies.

- **Phase 5: Testing and Deployment**
  Unit testing of API endpoints. Integration testing of the full user flow. Deploying the frontend to Vercel and backend to a cloud container service. Conducting User Acceptance Testing (UAT) with peer groups.

**Workflow Strategy:**
The system operates on a 'Check-Plan-Execute' workflow. First, the User Profile Module checks current status. Second, the AI Planning Module generates a path. Third, the Opportunity Module presents executable steps (applying to jobs, solving problems). This cyclic methodology ensures constant user progression.

### 6. Facilities Required
To successfully execute and deploy the SPORTS platform, a standard software engineering environment is required. Hardware prerequisites include personal computers with at least 8GB RAM and Intel i5/Ryzen 5 processors to support concurrent server execution and virtualization. Software requirements encompass VS Code as the primary IDE, Git for version control, and Node.js/Python 3.10+ runtimes. A stable high-speed internet connection is essential for accessing cloud APIs (Supabase, Gemini) and fetching real-time data via scrapers.

### 7. Expected Outcomes
The execution of this project will deliver a production-ready Web Application that serves as a personal career mentor for students. We expect to achieve a system that reduces the time students spend searching for opportunities by over 60% through intelligent aggregation. Furthermore, the AI-driven roadmap generation is anticipated to provide measurable improvements in skill acquisition rates. Ultimately, SPORTS will stand as a scalable, verified repository of student talent, ready to bridge the gap between academic potential and professional success.
