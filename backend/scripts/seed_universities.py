"""
Seed universities from real APIs into Supabase.

Run: python scripts/seed_universities.py

Data sources:
1. Hipolabs Universities API (global, free, no key needed)
2. Curated data with tuition/requirements (since Hipolabs only has names)
"""

import asyncio
import httpx
import os
import sys
import uuid
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Hipolabs API - free, no key needed
HIPOLABS_API = "http://universities.hipolabs.com/search"

# Countries to fetch
COUNTRIES = [
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "India"
]

# Curated tuition and requirements data for top universities
CURATED_DATA = {
    # USA
    "Massachusetts Institute of Technology": {
        "ranking": 1,
        "tuition_min": 55000,
        "tuition_max": 60000,
        "acceptance_rate": 4.0,
        "min_gpa": 3.9,
        "programs": ["Computer Science", "Engineering", "Business", "Physics", "Mathematics"],
        "city": "Cambridge, MA",
    },
    "Stanford University": {
        "ranking": 3,
        "tuition_min": 55000,
        "tuition_max": 60000,
        "acceptance_rate": 4.3,
        "min_gpa": 3.9,
        "programs": ["Computer Science", "Business", "Engineering", "Law", "Medicine"],
        "city": "Stanford, CA",
    },
    "Harvard University": {
        "ranking": 4,
        "tuition_min": 54000,
        "tuition_max": 58000,
        "acceptance_rate": 3.4,
        "min_gpa": 3.9,
        "programs": ["Business", "Law", "Medicine", "Economics", "Public Policy"],
        "city": "Cambridge, MA",
    },
    "California Institute of Technology": {
        "ranking": 6,
        "tuition_min": 56000,
        "tuition_max": 60000,
        "acceptance_rate": 3.9,
        "min_gpa": 3.9,
        "programs": ["Physics", "Chemistry", "Engineering", "Computer Science"],
        "city": "Pasadena, CA",
    },
    "University of Chicago": {
        "ranking": 10,
        "tuition_min": 58000,
        "tuition_max": 62000,
        "acceptance_rate": 5.4,
        "min_gpa": 3.8,
        "programs": ["Economics", "Business", "Law", "Public Policy", "Physics"],
        "city": "Chicago, IL",
    },
    "Princeton University": {
        "ranking": 7,
        "tuition_min": 53000,
        "tuition_max": 57000,
        "acceptance_rate": 4.0,
        "min_gpa": 3.9,
        "programs": ["Mathematics", "Physics", "Engineering", "Economics", "Public Policy"],
        "city": "Princeton, NJ",
    },
    "Yale University": {
        "ranking": 9,
        "tuition_min": 57000,
        "tuition_max": 62000,
        "acceptance_rate": 4.6,
        "min_gpa": 3.9,
        "programs": ["Law", "Medicine", "Arts", "Drama", "Economics"],
        "city": "New Haven, CT",
    },
    "University of Pennsylvania": {
        "ranking": 11,
        "tuition_min": 56000,
        "tuition_max": 61000,
        "acceptance_rate": 5.9,
        "min_gpa": 3.8,
        "programs": ["Business", "Medicine", "Law", "Engineering", "Nursing"],
        "city": "Philadelphia, PA",
    },
    "Duke University": {
        "ranking": 13,
        "tuition_min": 58000,
        "tuition_max": 62000,
        "acceptance_rate": 6.0,
        "min_gpa": 3.8,
        "programs": ["Medicine", "Business", "Law", "Public Policy", "Engineering"],
        "city": "Durham, NC",
    },
    "Northwestern University": {
        "ranking": 14,
        "tuition_min": 56000,
        "tuition_max": 60000,
        "acceptance_rate": 7.0,
        "min_gpa": 3.7,
        "programs": ["Journalism", "Business", "Law", "Engineering", "Medicine"],
        "city": "Evanston, IL",
    },
    "Cornell University": {
        "ranking": 17,
        "tuition_min": 57000,
        "tuition_max": 62000,
        "acceptance_rate": 7.9,
        "min_gpa": 3.7,
        "programs": ["Engineering", "Hotel Management", "Agriculture", "Architecture", "Business"],
        "city": "Ithaca, NY",
    },
    "University of California, Berkeley": {
        "ranking": 12,
        "tuition_min": 14000,
        "tuition_max": 45000,
        "acceptance_rate": 11.4,
        "min_gpa": 3.7,
        "programs": ["Computer Science", "Engineering", "Business", "Data Science"],
        "city": "Berkeley, CA",
    },
    "University of California, Los Angeles": {
        "ranking": 15,
        "tuition_min": 13000,
        "tuition_max": 44000,
        "acceptance_rate": 8.6,
        "min_gpa": 3.7,
        "programs": ["Film", "Business", "Engineering", "Medicine", "Law"],
        "city": "Los Angeles, CA",
    },
    "Columbia University": {
        "ranking": 18,
        "tuition_min": 62000,
        "tuition_max": 65000,
        "acceptance_rate": 3.9,
        "min_gpa": 3.8,
        "programs": ["Journalism", "Business", "Law", "Engineering", "Arts"],
        "city": "New York, NY",
    },
    "New York University": {
        "ranking": 35,
        "tuition_min": 54000,
        "tuition_max": 58000,
        "acceptance_rate": 12.2,
        "min_gpa": 3.5,
        "programs": ["Business", "Arts", "Law", "Film", "Data Science"],
        "city": "New York, NY",
    },
    "University of Michigan-Ann Arbor": {
        "ranking": 25,
        "tuition_min": 16000,
        "tuition_max": 52000,
        "acceptance_rate": 17.7,
        "min_gpa": 3.6,
        "programs": ["Engineering", "Business", "Medicine", "Public Policy"],
        "city": "Ann Arbor, MI",
    },
    "Carnegie Mellon University": {
        "ranking": 28,
        "tuition_min": 58000,
        "tuition_max": 62000,
        "acceptance_rate": 11.0,
        "min_gpa": 3.7,
        "programs": ["Computer Science", "Robotics", "AI", "Business", "Arts"],
        "city": "Pittsburgh, PA",
    },
    "Georgia Institute of Technology": {
        "ranking": 33,
        "tuition_min": 12000,
        "tuition_max": 33000,
        "acceptance_rate": 17.0,
        "min_gpa": 3.5,
        "programs": ["Engineering", "Computer Science", "Business", "Design"],
        "city": "Atlanta, GA",
    },
    "University of Texas at Austin": {
        "ranking": 38,
        "tuition_min": 11000,
        "tuition_max": 40000,
        "acceptance_rate": 31.0,
        "min_gpa": 3.4,
        "programs": ["Engineering", "Business", "Computer Science", "Law"],
        "city": "Austin, TX",
    },
    "University of Illinois Urbana-Champaign": {
        "ranking": 41,
        "tuition_min": 16000,
        "tuition_max": 35000,
        "acceptance_rate": 45.0,
        "min_gpa": 3.3,
        "programs": ["Engineering", "Computer Science", "Business", "Agriculture"],
        "city": "Champaign, IL",
    },
    "Boston University": {
        "ranking": 43,
        "tuition_min": 58000,
        "tuition_max": 62000,
        "acceptance_rate": 14.0,
        "min_gpa": 3.5,
        "programs": ["Business", "Communications", "Engineering", "Medicine"],
        "city": "Boston, MA",
    },
    "University of Washington": {
        "ranking": 55,
        "tuition_min": 12000,
        "tuition_max": 39000,
        "acceptance_rate": 48.0,
        "min_gpa": 3.3,
        "programs": ["Computer Science", "Engineering", "Business", "Medicine"],
        "city": "Seattle, WA",
    },
    "Purdue University": {
        "ranking": 60,
        "tuition_min": 10000,
        "tuition_max": 29000,
        "acceptance_rate": 53.0,
        "min_gpa": 3.2,
        "programs": ["Engineering", "Agriculture", "Business", "Computer Science"],
        "city": "West Lafayette, IN",
    },
    "University of Southern California": {
        "ranking": 29,
        "tuition_min": 58000,
        "tuition_max": 63000,
        "acceptance_rate": 9.9,
        "min_gpa": 3.6,
        "programs": ["Film", "Business", "Engineering", "Communications", "Arts"],
        "city": "Los Angeles, CA",
    },
    "University of Wisconsin-Madison": {
        "ranking": 42,
        "tuition_min": 11000,
        "tuition_max": 38000,
        "acceptance_rate": 49.0,
        "min_gpa": 3.3,
        "programs": ["Engineering", "Business", "Medicine", "Agriculture"],
        "city": "Madison, WI",
    },
    "University of California San Diego": {
        "ranking": 34,
        "tuition_min": 14000,
        "tuition_max": 44000,
        "acceptance_rate": 24.0,
        "min_gpa": 3.5,
        "programs": ["Engineering", "Biology", "Computer Science", "Economics"],
        "city": "San Diego, CA",
    },
    "University of Minnesota": {
        "ranking": 53,
        "tuition_min": 15000,
        "tuition_max": 33000,
        "acceptance_rate": 57.0,
        "min_gpa": 3.2,
        "programs": ["Engineering", "Business", "Medicine", "Agriculture"],
        "city": "Minneapolis, MN",
    },
    "Ohio State University": {
        "ranking": 49,
        "tuition_min": 11000,
        "tuition_max": 33000,
        "acceptance_rate": 53.0,
        "min_gpa": 3.2,
        "programs": ["Engineering", "Business", "Medicine", "Agriculture"],
        "city": "Columbus, OH",
    },
    "Penn State University": {
        "ranking": 63,
        "tuition_min": 18000,
        "tuition_max": 36000,
        "acceptance_rate": 55.0,
        "min_gpa": 3.2,
        "programs": ["Engineering", "Business", "Agriculture", "Education"],
        "city": "University Park, PA",
    },
    "Arizona State University": {
        "ranking": 105,
        "tuition_min": 11000,
        "tuition_max": 29000,
        "acceptance_rate": 88.0,
        "min_gpa": 2.8,
        "programs": ["Business", "Engineering", "Arts", "Education"],
        "city": "Tempe, AZ",
    },
    "University of Florida": {
        "ranking": 28,
        "tuition_min": 6000,
        "tuition_max": 28000,
        "acceptance_rate": 23.0,
        "min_gpa": 3.5,
        "programs": ["Engineering", "Business", "Medicine", "Agriculture"],
        "city": "Gainesville, FL",
    },
    "Indiana University Bloomington": {
        "ranking": 73,
        "tuition_min": 11000,
        "tuition_max": 38000,
        "acceptance_rate": 80.0,
        "min_gpa": 3.0,
        "programs": ["Business", "Music", "Education", "Public Affairs"],
        "city": "Bloomington, IN",
    },
    "University of Maryland": {
        "ranking": 55,
        "tuition_min": 11000,
        "tuition_max": 38000,
        "acceptance_rate": 45.0,
        "min_gpa": 3.3,
        "programs": ["Engineering", "Business", "Computer Science", "Public Policy"],
        "city": "College Park, MD",
    },
    "Virginia Tech": {
        "ranking": 62,
        "tuition_min": 14000,
        "tuition_max": 33000,
        "acceptance_rate": 57.0,
        "min_gpa": 3.2,
        "programs": ["Engineering", "Architecture", "Business", "Agriculture"],
        "city": "Blacksburg, VA",
    },
    "University of Virginia": {
        "ranking": 24,
        "tuition_min": 18000,
        "tuition_max": 52000,
        "acceptance_rate": 19.0,
        "min_gpa": 3.6,
        "programs": ["Business", "Law", "Medicine", "Engineering"],
        "city": "Charlottesville, VA",
    },
    "Rice University": {
        "ranking": 17,
        "tuition_min": 52000,
        "tuition_max": 56000,
        "acceptance_rate": 8.7,
        "min_gpa": 3.7,
        "programs": ["Engineering", "Business", "Architecture", "Music"],
        "city": "Houston, TX",
    },

    # UK
    "University of Oxford": {
        "ranking": 2,
        "tuition_min": 30000,
        "tuition_max": 45000,
        "acceptance_rate": 14.0,
        "min_gpa": 3.7,
        "programs": ["PPE", "Law", "Medicine", "Computer Science", "History"],
        "city": "Oxford",
    },
    "University of Cambridge": {
        "ranking": 5,
        "tuition_min": 28000,
        "tuition_max": 42000,
        "acceptance_rate": 18.0,
        "min_gpa": 3.7,
        "programs": ["Mathematics", "Engineering", "Natural Sciences", "Economics"],
        "city": "Cambridge",
    },
    "Imperial College London": {
        "ranking": 8,
        "tuition_min": 32000,
        "tuition_max": 48000,
        "acceptance_rate": 14.3,
        "min_gpa": 3.6,
        "programs": ["Engineering", "Medicine", "Business", "Computing", "Science"],
        "city": "London",
    },
    "University College London": {
        "ranking": 9,
        "tuition_min": 25000,
        "tuition_max": 38000,
        "acceptance_rate": 16.0,
        "min_gpa": 3.5,
        "programs": ["Law", "Architecture", "Economics", "Computer Science"],
        "city": "London",
    },
    "London School of Economics": {
        "ranking": 45,
        "tuition_min": 24000,
        "tuition_max": 35000,
        "acceptance_rate": 8.9,
        "min_gpa": 3.6,
        "programs": ["Economics", "Finance", "International Relations", "Law"],
        "city": "London",
    },
    "University of Edinburgh": {
        "ranking": 22,
        "tuition_min": 23000,
        "tuition_max": 35000,
        "acceptance_rate": 38.0,
        "min_gpa": 3.3,
        "programs": ["AI", "Medicine", "Law", "Arts", "Engineering"],
        "city": "Edinburgh",
    },
    "King's College London": {
        "ranking": 40,
        "tuition_min": 22000,
        "tuition_max": 35000,
        "acceptance_rate": 13.0,
        "min_gpa": 3.4,
        "programs": ["Law", "Medicine", "Humanities", "Social Sciences"],
        "city": "London",
    },
    "University of Manchester": {
        "ranking": 51,
        "tuition_min": 20000,
        "tuition_max": 30000,
        "acceptance_rate": 58.0,
        "min_gpa": 3.2,
        "programs": ["Engineering", "Business", "Medicine", "Computer Science"],
        "city": "Manchester",
    },
    "University of Warwick": {
        "ranking": 64,
        "tuition_min": 22000,
        "tuition_max": 32000,
        "acceptance_rate": 14.0,
        "min_gpa": 3.4,
        "programs": ["Business", "Economics", "Computer Science", "Mathematics"],
        "city": "Coventry",
    },
    "University of Bristol": {
        "ranking": 61,
        "tuition_min": 21000,
        "tuition_max": 30000,
        "acceptance_rate": 57.0,
        "min_gpa": 3.2,
        "programs": ["Engineering", "Law", "Medicine", "Arts"],
        "city": "Bristol",
    },
    "University of Glasgow": {
        "ranking": 76,
        "tuition_min": 20000,
        "tuition_max": 28000,
        "acceptance_rate": 60.0,
        "min_gpa": 3.1,
        "programs": ["Medicine", "Law", "Engineering", "Arts"],
        "city": "Glasgow",
    },
    "Durham University": {
        "ranking": 78,
        "tuition_min": 22000,
        "tuition_max": 30000,
        "acceptance_rate": 39.0,
        "min_gpa": 3.3,
        "programs": ["Law", "Business", "Engineering", "Humanities"],
        "city": "Durham",
    },
    "University of Birmingham": {
        "ranking": 84,
        "tuition_min": 19000,
        "tuition_max": 27000,
        "acceptance_rate": 65.0,
        "min_gpa": 3.0,
        "programs": ["Engineering", "Business", "Medicine", "Arts"],
        "city": "Birmingham",
    },
    "University of Leeds": {
        "ranking": 86,
        "tuition_min": 19000,
        "tuition_max": 26000,
        "acceptance_rate": 70.0,
        "min_gpa": 3.0,
        "programs": ["Engineering", "Business", "Medicine", "Arts"],
        "city": "Leeds",
    },
    "University of Southampton": {
        "ranking": 90,
        "tuition_min": 18000,
        "tuition_max": 25000,
        "acceptance_rate": 72.0,
        "min_gpa": 3.0,
        "programs": ["Engineering", "Computer Science", "Medicine", "Ocean Sciences"],
        "city": "Southampton",
    },

    # Canada
    "University of Toronto": {
        "ranking": 21,
        "tuition_min": 45000,
        "tuition_max": 60000,
        "acceptance_rate": 43.0,
        "min_gpa": 3.5,
        "programs": ["Engineering", "Business", "Computer Science", "Medicine"],
        "city": "Toronto",
    },
    "McGill University": {
        "ranking": 30,
        "tuition_min": 20000,
        "tuition_max": 50000,
        "acceptance_rate": 42.0,
        "min_gpa": 3.5,
        "programs": ["Medicine", "Law", "Engineering", "Arts"],
        "city": "Montreal",
    },
    "University of British Columbia": {
        "ranking": 34,
        "tuition_min": 35000,
        "tuition_max": 50000,
        "acceptance_rate": 52.0,
        "min_gpa": 3.3,
        "programs": ["Business", "Computer Science", "Engineering", "Forestry"],
        "city": "Vancouver",
    },
    "University of Waterloo": {
        "ranking": 112,
        "tuition_min": 35000,
        "tuition_max": 55000,
        "acceptance_rate": 53.0,
        "min_gpa": 3.3,
        "programs": ["Computer Science", "Engineering", "Mathematics", "Co-op"],
        "city": "Waterloo",
    },
    "University of Alberta": {
        "ranking": 111,
        "tuition_min": 25000,
        "tuition_max": 40000,
        "acceptance_rate": 58.0,
        "min_gpa": 3.2,
        "programs": ["Engineering", "Medicine", "Business", "Sciences"],
        "city": "Edmonton",
    },
    "Western University": {
        "ranking": 172,
        "tuition_min": 30000,
        "tuition_max": 45000,
        "acceptance_rate": 58.0,
        "min_gpa": 3.1,
        "programs": ["Business", "Medicine", "Engineering", "Law"],
        "city": "London, ON",
    },
    "Queen's University at Kingston": {
        "ranking": 209,
        "tuition_min": 40000,
        "tuition_max": 50000,
        "acceptance_rate": 42.0,
        "min_gpa": 3.3,
        "programs": ["Business", "Engineering", "Law", "Health Sciences"],
        "city": "Kingston",
    },
    "University of Montreal": {
        "ranking": 116,
        "tuition_min": 18000,
        "tuition_max": 30000,
        "acceptance_rate": 57.0,
        "min_gpa": 3.0,
        "programs": ["Medicine", "Law", "Engineering", "Arts"],
        "city": "Montreal",
    },
    "McMaster University": {
        "ranking": 152,
        "tuition_min": 30000,
        "tuition_max": 45000,
        "acceptance_rate": 55.0,
        "min_gpa": 3.2,
        "programs": ["Medicine", "Engineering", "Business", "Health Sciences"],
        "city": "Hamilton",
    },
    "University of Calgary": {
        "ranking": 182,
        "tuition_min": 20000,
        "tuition_max": 35000,
        "acceptance_rate": 60.0,
        "min_gpa": 3.0,
        "programs": ["Engineering", "Business", "Medicine", "Energy"],
        "city": "Calgary",
    },
    "University of Ottawa": {
        "ranking": 203,
        "tuition_min": 25000,
        "tuition_max": 40000,
        "acceptance_rate": 65.0,
        "min_gpa": 3.0,
        "programs": ["Law", "Medicine", "Engineering", "Public Administration"],
        "city": "Ottawa",
    },
    "Simon Fraser University": {
        "ranking": 298,
        "tuition_min": 25000,
        "tuition_max": 35000,
        "acceptance_rate": 60.0,
        "min_gpa": 3.0,
        "programs": ["Business", "Computing", "Engineering", "Communications"],
        "city": "Burnaby",
    },

    # Australia
    "University of Melbourne": {
        "ranking": 14,
        "tuition_min": 35000,
        "tuition_max": 50000,
        "acceptance_rate": 70.0,
        "min_gpa": 3.2,
        "programs": ["Business", "Law", "Medicine", "Engineering", "Arts"],
        "city": "Melbourne",
    },
    "University of Sydney": {
        "ranking": 19,
        "tuition_min": 35000,
        "tuition_max": 48000,
        "acceptance_rate": 30.0,
        "min_gpa": 3.3,
        "programs": ["Business", "Law", "Engineering", "Medicine", "Architecture"],
        "city": "Sydney",
    },
    "Australian National University": {
        "ranking": 27,
        "tuition_min": 32000,
        "tuition_max": 45000,
        "acceptance_rate": 35.0,
        "min_gpa": 3.2,
        "programs": ["International Relations", "Science", "Engineering", "Law"],
        "city": "Canberra",
    },
    "University of Queensland": {
        "ranking": 43,
        "tuition_min": 30000,
        "tuition_max": 42000,
        "acceptance_rate": 50.0,
        "min_gpa": 3.0,
        "programs": ["Business", "Engineering", "Medicine", "Agriculture"],
        "city": "Brisbane",
    },
    "Monash University": {
        "ranking": 44,
        "tuition_min": 30000,
        "tuition_max": 45000,
        "acceptance_rate": 60.0,
        "min_gpa": 3.0,
        "programs": ["Business", "Engineering", "Pharmacy", "IT"],
        "city": "Melbourne",
    },
    "University of New South Wales": {
        "ranking": 45,
        "tuition_min": 32000,
        "tuition_max": 48000,
        "acceptance_rate": 30.0,
        "min_gpa": 3.2,
        "programs": ["Engineering", "Business", "Law", "Medicine"],
        "city": "Sydney",
    },
    "University of Western Australia": {
        "ranking": 90,
        "tuition_min": 28000,
        "tuition_max": 40000,
        "acceptance_rate": 65.0,
        "min_gpa": 3.0,
        "programs": ["Engineering", "Medicine", "Business", "Sciences"],
        "city": "Perth",
    },
    "University of Adelaide": {
        "ranking": 111,
        "tuition_min": 28000,
        "tuition_max": 42000,
        "acceptance_rate": 70.0,
        "min_gpa": 2.9,
        "programs": ["Engineering", "Medicine", "Wine Studies", "Sciences"],
        "city": "Adelaide",
    },
    "University of Technology Sydney": {
        "ranking": 148,
        "tuition_min": 28000,
        "tuition_max": 40000,
        "acceptance_rate": 75.0,
        "min_gpa": 2.8,
        "programs": ["Engineering", "IT", "Business", "Design"],
        "city": "Sydney",
    },
    "RMIT University": {
        "ranking": 190,
        "tuition_min": 25000,
        "tuition_max": 38000,
        "acceptance_rate": 80.0,
        "min_gpa": 2.7,
        "programs": ["Design", "Engineering", "Business", "IT"],
        "city": "Melbourne",
    },

    # Germany
    "Technical University of Munich": {
        "ranking": 37,
        "tuition_min": 500,
        "tuition_max": 2000,
        "acceptance_rate": 8.0,
        "min_gpa": 3.5,
        "programs": ["Engineering", "Computer Science", "Physics", "Architecture"],
        "city": "Munich",
    },
    "Ludwig Maximilian University of Munich": {
        "ranking": 59,
        "tuition_min": 500,
        "tuition_max": 1500,
        "acceptance_rate": 30.0,
        "min_gpa": 3.3,
        "programs": ["Medicine", "Law", "Economics", "Physics"],
        "city": "Munich",
    },
    "Heidelberg University": {
        "ranking": 49,
        "tuition_min": 500,
        "tuition_max": 1500,
        "acceptance_rate": 20.0,
        "min_gpa": 3.3,
        "programs": ["Medicine", "Law", "Natural Sciences", "Humanities"],
        "city": "Heidelberg",
    },
    "Humboldt University of Berlin": {
        "ranking": 87,
        "tuition_min": 500,
        "tuition_max": 1500,
        "acceptance_rate": 40.0,
        "min_gpa": 3.0,
        "programs": ["Humanities", "Social Sciences", "Natural Sciences"],
        "city": "Berlin",
    },
    "Free University of Berlin": {
        "ranking": 98,
        "tuition_min": 500,
        "tuition_max": 1500,
        "acceptance_rate": 45.0,
        "min_gpa": 3.0,
        "programs": ["Political Science", "Economics", "Law", "Biology"],
        "city": "Berlin",
    },
    "RWTH Aachen University": {
        "ranking": 106,
        "tuition_min": 500,
        "tuition_max": 1500,
        "acceptance_rate": 35.0,
        "min_gpa": 3.2,
        "programs": ["Engineering", "Computer Science", "Natural Sciences"],
        "city": "Aachen",
    },
    "Technical University of Berlin": {
        "ranking": 154,
        "tuition_min": 500,
        "tuition_max": 1500,
        "acceptance_rate": 40.0,
        "min_gpa": 3.0,
        "programs": ["Engineering", "Computer Science", "Architecture"],
        "city": "Berlin",
    },
    "University of Freiburg": {
        "ranking": 149,
        "tuition_min": 500,
        "tuition_max": 1500,
        "acceptance_rate": 50.0,
        "min_gpa": 3.0,
        "programs": ["Medicine", "Law", "Sciences", "Humanities"],
        "city": "Freiburg",
    },
    "University of Tübingen": {
        "ranking": 144,
        "tuition_min": 500,
        "tuition_max": 1500,
        "acceptance_rate": 45.0,
        "min_gpa": 3.0,
        "programs": ["Medicine", "AI", "Humanities", "Sciences"],
        "city": "Tübingen",
    },
    "University of Bonn": {
        "ranking": 131,
        "tuition_min": 500,
        "tuition_max": 1500,
        "acceptance_rate": 55.0,
        "min_gpa": 2.9,
        "programs": ["Mathematics", "Economics", "Law", "Sciences"],
        "city": "Bonn",
    },

    # India
    "Indian Institute of Technology Bombay": {
        "ranking": 118,
        "tuition_min": 2000,
        "tuition_max": 5000,
        "acceptance_rate": 2.0,
        "min_gpa": 3.8,
        "programs": ["Engineering", "Computer Science", "Technology", "Design"],
        "city": "Mumbai",
    },
    "Indian Institute of Technology Delhi": {
        "ranking": 150,
        "tuition_min": 2000,
        "tuition_max": 5000,
        "acceptance_rate": 2.0,
        "min_gpa": 3.8,
        "programs": ["Engineering", "Computer Science", "Biotechnology", "Design"],
        "city": "New Delhi",
    },
    "Indian Institute of Technology Madras": {
        "ranking": 227,
        "tuition_min": 2000,
        "tuition_max": 5000,
        "acceptance_rate": 2.5,
        "min_gpa": 3.7,
        "programs": ["Engineering", "Computer Science", "Data Science", "Ocean Engineering"],
        "city": "Chennai",
    },
    "Indian Institute of Technology Kanpur": {
        "ranking": 263,
        "tuition_min": 2000,
        "tuition_max": 5000,
        "acceptance_rate": 2.5,
        "min_gpa": 3.7,
        "programs": ["Engineering", "Computer Science", "Aerospace", "Physics"],
        "city": "Kanpur",
    },
    "Indian Institute of Technology Kharagpur": {
        "ranking": 271,
        "tuition_min": 2000,
        "tuition_max": 5000,
        "acceptance_rate": 3.0,
        "min_gpa": 3.6,
        "programs": ["Engineering", "Architecture", "Law", "Management"],
        "city": "Kharagpur",
    },
    "Indian Institute of Science": {
        "ranking": 155,
        "tuition_min": 1500,
        "tuition_max": 4000,
        "acceptance_rate": 1.5,
        "min_gpa": 3.8,
        "programs": ["Science", "Engineering", "Research", "Biotechnology"],
        "city": "Bangalore",
    },
    "Indian Institute of Technology Roorkee": {
        "ranking": 369,
        "tuition_min": 2000,
        "tuition_max": 5000,
        "acceptance_rate": 3.5,
        "min_gpa": 3.5,
        "programs": ["Engineering", "Architecture", "Management", "Sciences"],
        "city": "Roorkee",
    },
    "Indian Institute of Technology Guwahati": {
        "ranking": 364,
        "tuition_min": 2000,
        "tuition_max": 5000,
        "acceptance_rate": 4.0,
        "min_gpa": 3.5,
        "programs": ["Engineering", "Design", "Sciences", "Humanities"],
        "city": "Guwahati",
    },
    "Delhi University": {
        "ranking": 407,
        "tuition_min": 500,
        "tuition_max": 3000,
        "acceptance_rate": 15.0,
        "min_gpa": 3.3,
        "programs": ["Arts", "Commerce", "Science", "Law"],
        "city": "New Delhi",
    },
    "Jawaharlal Nehru University": {
        "ranking": 363,
        "tuition_min": 500,
        "tuition_max": 2000,
        "acceptance_rate": 5.0,
        "min_gpa": 3.4,
        "programs": ["Social Sciences", "Languages", "International Relations", "Sciences"],
        "city": "New Delhi",
    },
    "Indian Institute of Management Ahmedabad": {
        "ranking": None,
        "tuition_min": 15000,
        "tuition_max": 25000,
        "acceptance_rate": 1.0,
        "min_gpa": 3.5,
        "programs": ["MBA", "Business", "Management", "Finance"],
        "city": "Ahmedabad",
    },
    "Indian Institute of Management Bangalore": {
        "ranking": None,
        "tuition_min": 15000,
        "tuition_max": 25000,
        "acceptance_rate": 1.5,
        "min_gpa": 3.5,
        "programs": ["MBA", "Business", "Management", "Entrepreneurship"],
        "city": "Bangalore",
    },
    "BITS Pilani": {
        "ranking": 801,
        "tuition_min": 8000,
        "tuition_max": 15000,
        "acceptance_rate": 5.0,
        "min_gpa": 3.4,
        "programs": ["Engineering", "Computer Science", "Pharmacy", "Sciences"],
        "city": "Pilani",
    },
    "Vellore Institute of Technology": {
        "ranking": 601,
        "tuition_min": 5000,
        "tuition_max": 10000,
        "acceptance_rate": 25.0,
        "min_gpa": 3.0,
        "programs": ["Engineering", "Computer Science", "Business", "Sciences"],
        "city": "Vellore",
    },
    "Manipal Academy of Higher Education": {
        "ranking": 751,
        "tuition_min": 8000,
        "tuition_max": 15000,
        "acceptance_rate": 30.0,
        "min_gpa": 2.8,
        "programs": ["Medicine", "Engineering", "Management", "Pharmacy"],
        "city": "Manipal",
    },
    "SRM Institute of Science and Technology": {
        "ranking": 801,
        "tuition_min": 5000,
        "tuition_max": 12000,
        "acceptance_rate": 35.0,
        "min_gpa": 2.8,
        "programs": ["Engineering", "Medicine", "Management", "Sciences"],
        "city": "Chennai",
    },
    "Amity University": {
        "ranking": 901,
        "tuition_min": 4000,
        "tuition_max": 10000,
        "acceptance_rate": 60.0,
        "min_gpa": 2.5,
        "programs": ["Engineering", "Business", "Law", "Arts"],
        "city": "Noida",
    },
    "Lovely Professional University": {
        "ranking": 1001,
        "tuition_min": 3000,
        "tuition_max": 8000,
        "acceptance_rate": 70.0,
        "min_gpa": 2.3,
        "programs": ["Engineering", "Business", "Agriculture", "Design"],
        "city": "Phagwara",
    },
}


async def fetch_hipolabs_universities(country: str, retries: int = 3) -> list:
    """Fetch universities from Hipolabs API for a given country with retry logic."""
    for attempt in range(retries):
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                print(f"  Attempt {attempt + 1}/{retries}...")
                response = await client.get(HIPOLABS_API, params={"country": country})
                response.raise_for_status()
                return response.json()
            except Exception as e:
                print(f"  Error: {e}")
                if attempt < retries - 1:
                    await asyncio.sleep(2)  # Wait before retry
                continue
    return []


def normalize_name(name: str) -> str:
    """Normalize university name for matching."""
    return name.lower().strip()


def get_curated_data(name: str) -> dict | None:
    """Get curated data for a university if available."""
    for curated_name, data in CURATED_DATA.items():
        if normalize_name(curated_name) in normalize_name(name) or normalize_name(name) in normalize_name(curated_name):
            return {**data, "matched_name": curated_name}
    return None


def create_curated_only_universities() -> list:
    """Create university records from curated data that might not be in Hipolabs."""
    # Group curated data by country
    country_mapping = {
        "Massachusetts": "USA", "Stanford": "USA", "Harvard": "USA", "California": "USA",
        "Chicago": "USA", "Princeton": "USA", "Yale": "USA", "Pennsylvania": "USA",
        "Duke": "USA", "Northwestern": "USA", "Cornell": "USA", "Columbia": "USA",
        "New York": "USA", "Michigan": "USA", "Carnegie": "USA", "Georgia": "USA",
        "Texas": "USA", "Illinois": "USA", "Boston": "USA", "Washington": "USA",
        "Purdue": "USA", "Southern California": "USA", "Wisconsin": "USA",
        "Minnesota": "USA", "Ohio": "USA", "Penn State": "USA", "Arizona": "USA",
        "Florida": "USA", "Indiana": "USA", "Maryland": "USA", "Virginia": "USA",
        "Rice": "USA",
        "Oxford": "UK", "Cambridge": "UK", "Imperial": "UK", "University College London": "UK",
        "London School": "UK", "Edinburgh": "UK", "King's College": "UK", "Manchester": "UK",
        "Warwick": "UK", "Bristol": "UK", "Glasgow": "UK", "Durham": "UK",
        "Birmingham": "UK", "Leeds": "UK", "Southampton": "UK",
        "Toronto": "Canada", "McGill": "Canada", "British Columbia": "Canada",
        "Waterloo": "Canada", "Alberta": "Canada", "Western": "Canada", "Queen's": "Canada",
        "Montreal": "Canada", "McMaster": "Canada", "Calgary": "Canada", "Ottawa": "Canada",
        "Simon Fraser": "Canada",
        "Melbourne": "Australia", "Sydney": "Australia", "Australian National": "Australia",
        "Queensland": "Australia", "Monash": "Australia", "New South Wales": "Australia",
        "Western Australia": "Australia", "Adelaide": "Australia", "Technology Sydney": "Australia",
        "RMIT": "Australia",
        "Technical University of Munich": "Germany", "Ludwig": "Germany", "Heidelberg": "Germany",
        "Humboldt": "Germany", "Free University": "Germany", "RWTH": "Germany",
        "Technical University of Berlin": "Germany", "Freiburg": "Germany", "Tübingen": "Germany",
        "Bonn": "Germany",
        "IIT": "India", "Indian Institute": "India", "Delhi University": "India",
        "Jawaharlal": "India", "IIM": "India", "BITS": "India", "Vellore": "India",
        "Manipal": "India", "SRM": "India", "Amity": "India", "Lovely": "India",
    }

    universities = []
    for name, data in CURATED_DATA.items():
        country = "USA"
        for keyword, c in country_mapping.items():
            if keyword.lower() in name.lower():
                country = c
                break

        universities.append({
            "id": str(uuid.uuid4()),
            "name": name,
            "country": country,
            "city": data.get("city"),
            "ranking": data.get("ranking"),
            "tuition_min": data.get("tuition_min"),
            "tuition_max": data.get("tuition_max"),
            "acceptance_rate": data.get("acceptance_rate"),
            "min_gpa": data.get("min_gpa"),
            "programs": data.get("programs", []),
            "website": None,
            "data_source": "curated",
        })

    return universities


async def seed_universities():
    """Main function to seed universities."""
    print("Starting university seeding...")
    print("=" * 50)

    all_universities = []
    seen_names = set()

    # First, add all curated universities (high quality data)
    print("\nAdding curated universities...")
    curated_unis = create_curated_only_universities()
    for uni in curated_unis:
        if normalize_name(uni["name"]) not in seen_names:
            seen_names.add(normalize_name(uni["name"]))
            all_universities.append(uni)
    print(f"  Added {len(curated_unis)} curated universities")

    # Then fetch from Hipolabs and add universities not already in curated
    for country in COUNTRIES:
        print(f"\nFetching additional universities from {country}...")
        universities = await fetch_hipolabs_universities(country)
        print(f"  Found {len(universities)} universities from API")

        # Map country names
        country_map = {
            "United States": "USA",
            "United Kingdom": "UK",
            "Canada": "Canada",
            "Australia": "Australia",
            "Germany": "Germany",
            "India": "India"
        }

        added = 0
        for uni in universities:
            name = uni.get("name", "")
            if not name or normalize_name(name) in seen_names:
                continue

            # Skip if already have curated version
            curated = get_curated_data(name)
            if curated:
                continue

            uni_data = {
                "id": str(uuid.uuid4()),
                "name": name,
                "country": country_map.get(country, country),
                "city": None,
                "ranking": None,
                "tuition_min": None,
                "tuition_max": None,
                "acceptance_rate": None,
                "min_gpa": None,
                "programs": [],
                "website": uni.get("web_pages", [None])[0],
                "data_source": "hipolabs",
            }

            seen_names.add(normalize_name(name))
            all_universities.append(uni_data)
            added += 1

            # Limit additional universities per country
            if added >= 30:
                break

        print(f"  Added {added} additional universities from {country}")

    print(f"\n{'=' * 50}")
    print(f"Total universities to insert: {len(all_universities)}")

    # Clear existing universities
    print("\nClearing existing universities...")
    try:
        supabase.table("universities").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        print("  Cleared existing data")
    except Exception as e:
        print(f"  Warning: Could not clear existing data: {e}")

    # Insert in batches
    print("\nInserting universities...")
    batch_size = 50
    inserted = 0

    for i in range(0, len(all_universities), batch_size):
        batch = all_universities[i:i + batch_size]
        try:
            result = supabase.table("universities").insert(batch).execute()
            inserted += len(batch)
            print(f"  Inserted batch {i // batch_size + 1}: {len(batch)} universities")
        except Exception as e:
            print(f"  Error inserting batch: {e}")

    print(f"\n{'=' * 50}")
    print(f"Seeding complete! Inserted {inserted} universities.")

    # Verify and show breakdown
    print("\nVerifying by country...")
    for country in ["USA", "UK", "Canada", "Australia", "Germany", "India"]:
        count = supabase.table("universities").select("id", count="exact").eq("country", country).execute()
        print(f"  {country}: {count.count} universities")

    total = supabase.table("universities").select("id", count="exact").execute()
    print(f"\nTotal in database: {total.count} universities")


if __name__ == "__main__":
    asyncio.run(seed_universities())
