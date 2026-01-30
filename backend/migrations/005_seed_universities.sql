-- Seed universities from multiple countries
-- Run this in Supabase SQL Editor

-- Clear existing data (optional - comment out if you want to keep existing)
-- TRUNCATE TABLE universities CASCADE;

-- USA Universities
INSERT INTO universities (name, country, city, ranking, tuition_min, tuition_max, acceptance_rate, min_gpa, programs, website) VALUES
('Massachusetts Institute of Technology', 'USA', 'Cambridge', 1, 55000, 60000, 4, 3.9, ARRAY['Engineering', 'Computer Science', 'Physics', 'Mathematics'], 'https://mit.edu'),
('Stanford University', 'USA', 'Stanford', 2, 55000, 60000, 4, 3.9, ARRAY['Computer Science', 'Engineering', 'Business', 'Medicine'], 'https://stanford.edu'),
('Harvard University', 'USA', 'Cambridge', 3, 55000, 60000, 3, 3.9, ARRAY['Law', 'Business', 'Medicine', 'Economics'], 'https://harvard.edu'),
('California Institute of Technology', 'USA', 'Pasadena', 6, 55000, 60000, 3, 3.9, ARRAY['Physics', 'Engineering', 'Computer Science'], 'https://caltech.edu'),
('University of Chicago', 'USA', 'Chicago', 10, 58000, 62000, 5, 3.8, ARRAY['Economics', 'Business', 'Law', 'Political Science'], 'https://uchicago.edu'),
('Princeton University', 'USA', 'Princeton', 7, 55000, 58000, 4, 3.9, ARRAY['Mathematics', 'Physics', 'Economics', 'Computer Science'], 'https://princeton.edu'),
('Columbia University', 'USA', 'New York', 12, 60000, 65000, 4, 3.8, ARRAY['Business', 'Journalism', 'Law', 'Engineering'], 'https://columbia.edu'),
('Yale University', 'USA', 'New Haven', 9, 58000, 62000, 5, 3.9, ARRAY['Law', 'Drama', 'Political Science', 'Economics'], 'https://yale.edu'),
('University of Pennsylvania', 'USA', 'Philadelphia', 13, 58000, 63000, 6, 3.8, ARRAY['Business', 'Medicine', 'Law', 'Engineering'], 'https://upenn.edu'),
('Duke University', 'USA', 'Durham', 25, 58000, 62000, 6, 3.8, ARRAY['Medicine', 'Business', 'Law', 'Public Policy'], 'https://duke.edu'),
('Northwestern University', 'USA', 'Evanston', 24, 58000, 62000, 7, 3.7, ARRAY['Journalism', 'Business', 'Engineering', 'Theatre'], 'https://northwestern.edu'),
('Johns Hopkins University', 'USA', 'Baltimore', 15, 55000, 60000, 8, 3.7, ARRAY['Medicine', 'Public Health', 'Engineering', 'International Studies'], 'https://jhu.edu'),
('Carnegie Mellon University', 'USA', 'Pittsburgh', 22, 58000, 62000, 11, 3.7, ARRAY['Computer Science', 'Engineering', 'Business', 'Arts'], 'https://cmu.edu'),
('Georgia Institute of Technology', 'USA', 'Atlanta', 33, 32000, 45000, 17, 3.6, ARRAY['Engineering', 'Computer Science', 'Business', 'Design'], 'https://gatech.edu'),
('University of Michigan', 'USA', 'Ann Arbor', 21, 50000, 55000, 18, 3.6, ARRAY['Engineering', 'Business', 'Medicine', 'Law'], 'https://umich.edu'),
('University of California Berkeley', 'USA', 'Berkeley', 8, 44000, 48000, 12, 3.8, ARRAY['Computer Science', 'Engineering', 'Business', 'Law'], 'https://berkeley.edu'),
('UCLA', 'USA', 'Los Angeles', 20, 44000, 48000, 9, 3.7, ARRAY['Film', 'Medicine', 'Engineering', 'Business'], 'https://ucla.edu'),
('New York University', 'USA', 'New York', 35, 55000, 60000, 13, 3.6, ARRAY['Business', 'Film', 'Arts', 'Law'], 'https://nyu.edu'),
('University of Southern California', 'USA', 'Los Angeles', 28, 58000, 62000, 12, 3.6, ARRAY['Film', 'Business', 'Engineering', 'Communications'], 'https://usc.edu'),
('Boston University', 'USA', 'Boston', 42, 55000, 60000, 19, 3.5, ARRAY['Business', 'Engineering', 'Communications', 'Medicine'], 'https://bu.edu')
ON CONFLICT (id) DO NOTHING;

-- UK Universities
INSERT INTO universities (name, country, city, ranking, tuition_min, tuition_max, acceptance_rate, min_gpa, programs, website) VALUES
('University of Oxford', 'UK', 'Oxford', 4, 35000, 45000, 15, 3.8, ARRAY['Law', 'Medicine', 'Philosophy', 'Economics'], 'https://ox.ac.uk'),
('University of Cambridge', 'UK', 'Cambridge', 5, 35000, 45000, 18, 3.8, ARRAY['Engineering', 'Natural Sciences', 'Mathematics', 'Economics'], 'https://cam.ac.uk'),
('Imperial College London', 'UK', 'London', 8, 38000, 48000, 12, 3.7, ARRAY['Engineering', 'Medicine', 'Science', 'Business'], 'https://imperial.ac.uk'),
('University College London', 'UK', 'London', 14, 28000, 38000, 25, 3.5, ARRAY['Architecture', 'Medicine', 'Law', 'Economics'], 'https://ucl.ac.uk'),
('London School of Economics', 'UK', 'London', 27, 25000, 35000, 8, 3.7, ARRAY['Economics', 'Political Science', 'Finance', 'Law'], 'https://lse.ac.uk'),
('University of Edinburgh', 'UK', 'Edinburgh', 22, 25000, 35000, 30, 3.5, ARRAY['Medicine', 'Law', 'Informatics', 'Business'], 'https://ed.ac.uk'),
('Kings College London', 'UK', 'London', 40, 25000, 35000, 35, 3.4, ARRAY['Medicine', 'Law', 'Humanities', 'Social Sciences'], 'https://kcl.ac.uk'),
('University of Manchester', 'UK', 'Manchester', 32, 23000, 32000, 40, 3.3, ARRAY['Engineering', 'Business', 'Medicine', 'Computer Science'], 'https://manchester.ac.uk'),
('University of Warwick', 'UK', 'Coventry', 64, 22000, 30000, 45, 3.4, ARRAY['Business', 'Economics', 'Engineering', 'Mathematics'], 'https://warwick.ac.uk'),
('University of Bristol', 'UK', 'Bristol', 55, 22000, 30000, 42, 3.4, ARRAY['Engineering', 'Law', 'Medicine', 'Arts'], 'https://bristol.ac.uk'),
('University of Glasgow', 'UK', 'Glasgow', 76, 20000, 28000, 50, 3.3, ARRAY['Medicine', 'Engineering', 'Arts', 'Business'], 'https://gla.ac.uk'),
('Durham University', 'UK', 'Durham', 78, 22000, 30000, 38, 3.5, ARRAY['Business', 'Law', 'Engineering', 'Sciences'], 'https://dur.ac.uk')
ON CONFLICT (id) DO NOTHING;

-- Canada Universities
INSERT INTO universities (name, country, city, ranking, tuition_min, tuition_max, acceptance_rate, min_gpa, programs, website) VALUES
('University of Toronto', 'Canada', 'Toronto', 18, 45000, 55000, 43, 3.5, ARRAY['Engineering', 'Computer Science', 'Business', 'Medicine'], 'https://utoronto.ca'),
('McGill University', 'Canada', 'Montreal', 30, 20000, 45000, 42, 3.5, ARRAY['Medicine', 'Law', 'Engineering', 'Arts'], 'https://mcgill.ca'),
('University of British Columbia', 'Canada', 'Vancouver', 34, 38000, 48000, 46, 3.4, ARRAY['Engineering', 'Business', 'Computer Science', 'Medicine'], 'https://ubc.ca'),
('University of Waterloo', 'Canada', 'Waterloo', 112, 35000, 45000, 53, 3.3, ARRAY['Computer Science', 'Engineering', 'Mathematics', 'Business'], 'https://uwaterloo.ca'),
('University of Alberta', 'Canada', 'Edmonton', 110, 25000, 35000, 58, 3.2, ARRAY['Engineering', 'Business', 'Medicine', 'Sciences'], 'https://ualberta.ca'),
('McMaster University', 'Canada', 'Hamilton', 140, 28000, 38000, 55, 3.3, ARRAY['Engineering', 'Health Sciences', 'Business', 'Science'], 'https://mcmaster.ca'),
('University of Montreal', 'Canada', 'Montreal', 116, 18000, 28000, 50, 3.2, ARRAY['Medicine', 'Law', 'Engineering', 'Arts'], 'https://umontreal.ca'),
('Queens University', 'Canada', 'Kingston', 246, 30000, 40000, 42, 3.4, ARRAY['Business', 'Engineering', 'Law', 'Medicine'], 'https://queensu.ca'),
('Western University', 'Canada', 'London', 172, 28000, 38000, 50, 3.3, ARRAY['Business', 'Medicine', 'Law', 'Engineering'], 'https://uwo.ca'),
('Simon Fraser University', 'Canada', 'Burnaby', 298, 25000, 35000, 60, 3.1, ARRAY['Computer Science', 'Business', 'Communications', 'Engineering'], 'https://sfu.ca')
ON CONFLICT (id) DO NOTHING;

-- Australia Universities
INSERT INTO universities (name, country, city, ranking, tuition_min, tuition_max, acceptance_rate, min_gpa, programs, website) VALUES
('University of Melbourne', 'Australia', 'Melbourne', 14, 35000, 45000, 35, 3.5, ARRAY['Medicine', 'Law', 'Engineering', 'Business'], 'https://unimelb.edu.au'),
('University of Sydney', 'Australia', 'Sydney', 19, 35000, 45000, 40, 3.4, ARRAY['Medicine', 'Law', 'Business', 'Engineering'], 'https://sydney.edu.au'),
('Australian National University', 'Australia', 'Canberra', 30, 32000, 42000, 35, 3.5, ARRAY['Political Science', 'Engineering', 'Science', 'Law'], 'https://anu.edu.au'),
('University of Queensland', 'Australia', 'Brisbane', 43, 30000, 40000, 45, 3.3, ARRAY['Medicine', 'Engineering', 'Business', 'Science'], 'https://uq.edu.au'),
('Monash University', 'Australia', 'Melbourne', 42, 32000, 42000, 50, 3.3, ARRAY['Engineering', 'Medicine', 'Business', 'IT'], 'https://monash.edu'),
('UNSW Sydney', 'Australia', 'Sydney', 45, 35000, 45000, 45, 3.4, ARRAY['Engineering', 'Business', 'Law', 'Medicine'], 'https://unsw.edu.au'),
('University of Western Australia', 'Australia', 'Perth', 90, 28000, 38000, 55, 3.2, ARRAY['Engineering', 'Medicine', 'Business', 'Science'], 'https://uwa.edu.au'),
('University of Adelaide', 'Australia', 'Adelaide', 109, 28000, 38000, 60, 3.1, ARRAY['Medicine', 'Engineering', 'Wine Business', 'Sciences'], 'https://adelaide.edu.au'),
('University of Technology Sydney', 'Australia', 'Sydney', 90, 30000, 40000, 55, 3.0, ARRAY['IT', 'Engineering', 'Business', 'Design'], 'https://uts.edu.au'),
('RMIT University', 'Australia', 'Melbourne', 140, 28000, 38000, 60, 3.0, ARRAY['Design', 'Engineering', 'Business', 'IT'], 'https://rmit.edu.au')
ON CONFLICT (id) DO NOTHING;

-- Germany Universities
INSERT INTO universities (name, country, city, ranking, tuition_min, tuition_max, acceptance_rate, min_gpa, programs, website) VALUES
('Technical University of Munich', 'Germany', 'Munich', 37, 500, 3000, 25, 3.5, ARRAY['Engineering', 'Computer Science', 'Natural Sciences', 'Management'], 'https://tum.de'),
('Ludwig Maximilian University', 'Germany', 'Munich', 59, 500, 2000, 30, 3.4, ARRAY['Medicine', 'Law', 'Economics', 'Physics'], 'https://lmu.de'),
('Heidelberg University', 'Germany', 'Heidelberg', 65, 500, 2000, 35, 3.4, ARRAY['Medicine', 'Natural Sciences', 'Humanities', 'Law'], 'https://uni-heidelberg.de'),
('Humboldt University Berlin', 'Germany', 'Berlin', 87, 500, 2000, 40, 3.3, ARRAY['Humanities', 'Social Sciences', 'Natural Sciences', 'Law'], 'https://hu-berlin.de'),
('Free University of Berlin', 'Germany', 'Berlin', 118, 500, 2000, 45, 3.2, ARRAY['Political Science', 'Biology', 'Chemistry', 'Computer Science'], 'https://fu-berlin.de'),
('RWTH Aachen', 'Germany', 'Aachen', 106, 500, 2000, 35, 3.4, ARRAY['Engineering', 'Computer Science', 'Natural Sciences', 'Medicine'], 'https://rwth-aachen.de'),
('University of Freiburg', 'Germany', 'Freiburg', 149, 500, 2000, 50, 3.2, ARRAY['Medicine', 'Biology', 'Law', 'Environment'], 'https://uni-freiburg.de'),
('University of Gottingen', 'Germany', 'Gottingen', 119, 500, 2000, 50, 3.2, ARRAY['Physics', 'Chemistry', 'Biology', 'Economics'], 'https://uni-goettingen.de'),
('Technical University of Berlin', 'Germany', 'Berlin', 154, 500, 2000, 45, 3.3, ARRAY['Engineering', 'Computer Science', 'Architecture', 'Economics'], 'https://tu-berlin.de'),
('University of Bonn', 'Germany', 'Bonn', 131, 500, 2000, 50, 3.2, ARRAY['Mathematics', 'Economics', 'Law', 'Medicine'], 'https://uni-bonn.de')
ON CONFLICT (id) DO NOTHING;

-- India Universities
INSERT INTO universities (name, country, city, ranking, tuition_min, tuition_max, acceptance_rate, min_gpa, programs, website) VALUES
('Indian Institute of Technology Bombay', 'India', 'Mumbai', 149, 2000, 5000, 2, 3.8, ARRAY['Engineering', 'Computer Science', 'Design', 'Management'], 'https://iitb.ac.in'),
('Indian Institute of Technology Delhi', 'India', 'New Delhi', 185, 2000, 5000, 2, 3.8, ARRAY['Engineering', 'Computer Science', 'Design', 'Biotechnology'], 'https://iitd.ac.in'),
('Indian Institute of Science', 'India', 'Bangalore', 155, 1000, 3000, 3, 3.7, ARRAY['Science', 'Engineering', 'Design', 'Management'], 'https://iisc.ac.in'),
('Indian Institute of Technology Madras', 'India', 'Chennai', 227, 2000, 5000, 2, 3.8, ARRAY['Engineering', 'Computer Science', 'Humanities', 'Management'], 'https://iitm.ac.in'),
('Indian Institute of Technology Kanpur', 'India', 'Kanpur', 278, 2000, 5000, 2, 3.7, ARRAY['Engineering', 'Computer Science', 'Design', 'Management'], 'https://iitk.ac.in'),
('Indian Institute of Technology Kharagpur', 'India', 'Kharagpur', 271, 2000, 5000, 3, 3.7, ARRAY['Engineering', 'Architecture', 'Law', 'Management'], 'https://iitkgp.ac.in'),
('University of Delhi', 'India', 'New Delhi', 407, 500, 2000, 25, 3.2, ARRAY['Arts', 'Commerce', 'Science', 'Law'], 'https://du.ac.in'),
('Indian Institute of Management Ahmedabad', 'India', 'Ahmedabad', 0, 15000, 25000, 1, 3.8, ARRAY['Business', 'Management', 'Public Policy'], 'https://iima.ac.in'),
('BITS Pilani', 'India', 'Pilani', 801, 8000, 15000, 5, 3.5, ARRAY['Engineering', 'Science', 'Pharmacy', 'Management'], 'https://bits-pilani.ac.in'),
('Jawaharlal Nehru University', 'India', 'New Delhi', 601, 200, 1000, 15, 3.3, ARRAY['Social Sciences', 'International Studies', 'Languages', 'Sciences'], 'https://jnu.ac.in'),
('Anna University', 'India', 'Chennai', 427, 1000, 3000, 20, 3.2, ARRAY['Engineering', 'Architecture', 'Technology', 'Management'], 'https://annauniv.edu'),
('Manipal Academy of Higher Education', 'India', 'Manipal', 751, 10000, 20000, 30, 3.0, ARRAY['Medicine', 'Engineering', 'Management', 'Communication'], 'https://manipal.edu')
ON CONFLICT (id) DO NOTHING;

-- Additional countries: Singapore, Netherlands, Switzerland, Japan, South Korea

-- Singapore Universities
INSERT INTO universities (name, country, city, ranking, tuition_min, tuition_max, acceptance_rate, min_gpa, programs, website) VALUES
('National University of Singapore', 'Singapore', 'Singapore', 11, 25000, 40000, 20, 3.6, ARRAY['Engineering', 'Business', 'Computing', 'Medicine'], 'https://nus.edu.sg'),
('Nanyang Technological University', 'Singapore', 'Singapore', 26, 25000, 40000, 25, 3.5, ARRAY['Engineering', 'Business', 'Science', 'Communication'], 'https://ntu.edu.sg'),
('Singapore Management University', 'Singapore', 'Singapore', 545, 35000, 45000, 30, 3.4, ARRAY['Business', 'Law', 'Economics', 'Information Systems'], 'https://smu.edu.sg')
ON CONFLICT (id) DO NOTHING;

-- Netherlands Universities
INSERT INTO universities (name, country, city, ranking, tuition_min, tuition_max, acceptance_rate, min_gpa, programs, website) VALUES
('University of Amsterdam', 'Netherlands', 'Amsterdam', 53, 15000, 25000, 40, 3.3, ARRAY['Social Sciences', 'Humanities', 'Science', 'Economics'], 'https://uva.nl'),
('Delft University of Technology', 'Netherlands', 'Delft', 47, 15000, 20000, 35, 3.4, ARRAY['Engineering', 'Architecture', 'Design', 'Computer Science'], 'https://tudelft.nl'),
('Leiden University', 'Netherlands', 'Leiden', 126, 13000, 20000, 45, 3.3, ARRAY['Law', 'Medicine', 'Humanities', 'Science'], 'https://universiteitleiden.nl'),
('Erasmus University Rotterdam', 'Netherlands', 'Rotterdam', 176, 15000, 25000, 40, 3.3, ARRAY['Business', 'Economics', 'Medicine', 'Law'], 'https://eur.nl')
ON CONFLICT (id) DO NOTHING;

-- Switzerland Universities
INSERT INTO universities (name, country, city, ranking, tuition_min, tuition_max, acceptance_rate, min_gpa, programs, website) VALUES
('ETH Zurich', 'Switzerland', 'Zurich', 7, 1500, 3000, 27, 3.7, ARRAY['Engineering', 'Computer Science', 'Physics', 'Architecture'], 'https://ethz.ch'),
('EPFL', 'Switzerland', 'Lausanne', 36, 1500, 3000, 30, 3.6, ARRAY['Engineering', 'Computer Science', 'Life Sciences', 'Architecture'], 'https://epfl.ch'),
('University of Zurich', 'Switzerland', 'Zurich', 83, 2000, 4000, 40, 3.4, ARRAY['Medicine', 'Law', 'Economics', 'Science'], 'https://uzh.ch')
ON CONFLICT (id) DO NOTHING;

-- Japan Universities
INSERT INTO universities (name, country, city, ranking, tuition_min, tuition_max, acceptance_rate, min_gpa, programs, website) VALUES
('University of Tokyo', 'Japan', 'Tokyo', 23, 5000, 10000, 25, 3.6, ARRAY['Engineering', 'Medicine', 'Law', 'Science'], 'https://u-tokyo.ac.jp'),
('Kyoto University', 'Japan', 'Kyoto', 46, 5000, 10000, 30, 3.5, ARRAY['Science', 'Medicine', 'Engineering', 'Humanities'], 'https://kyoto-u.ac.jp'),
('Tokyo Institute of Technology', 'Japan', 'Tokyo', 91, 5000, 10000, 25, 3.5, ARRAY['Engineering', 'Science', 'Computing', 'Design'], 'https://titech.ac.jp'),
('Osaka University', 'Japan', 'Osaka', 80, 5000, 10000, 35, 3.4, ARRAY['Engineering', 'Medicine', 'Science', 'Economics'], 'https://osaka-u.ac.jp')
ON CONFLICT (id) DO NOTHING;

-- South Korea Universities
INSERT INTO universities (name, country, city, ranking, tuition_min, tuition_max, acceptance_rate, min_gpa, programs, website) VALUES
('Seoul National University', 'South Korea', 'Seoul', 41, 6000, 12000, 20, 3.6, ARRAY['Engineering', 'Business', 'Medicine', 'Law'], 'https://snu.ac.kr'),
('KAIST', 'South Korea', 'Daejeon', 56, 6000, 10000, 15, 3.6, ARRAY['Engineering', 'Science', 'Business', 'Computing'], 'https://kaist.ac.kr'),
('Yonsei University', 'South Korea', 'Seoul', 76, 10000, 18000, 25, 3.4, ARRAY['Business', 'Medicine', 'Engineering', 'Social Sciences'], 'https://yonsei.ac.kr'),
('Korea University', 'South Korea', 'Seoul', 79, 10000, 18000, 25, 3.4, ARRAY['Business', 'Law', 'Engineering', 'International Studies'], 'https://korea.ac.kr')
ON CONFLICT (id) DO NOTHING;
