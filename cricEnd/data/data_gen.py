import pandas as pd
import random

def generate_t20i_data(num_rows=100):
    player_names = [
        "Virat Kohli", "Rohit Sharma", "Babar Azam", "Mohammad Rizwan", "Jos Buttler",
        "Suryakumar Yadav", "Devon Conway", "Glenn Maxwell", "David Miller", "Shakib Al Hasan",
        "Rashid Khan", "Mitchell Marsh", "Nicholas Pooran", "Hardik Pandya", "Wanindu Hasaranga",
        "KL Rahul", "Aiden Markram", "Heinrich Klaasen", "Rassie van der Dussen", "Pathum Nissanka",
        "Shubman Gill", "Ruturaj Gaikwad", "Ishan Kishan", "Shreyas Iyer", "Sanju Samson",
        "Yashasvi Jaiswal", "Tilak Varma", "Rinku Singh", "Jitesh Sharma", "Arshdeep Singh",
        "Umran Malik", "Washington Sundar", "Axar Patel", "Kuldeep Yadav", "Yuzvendra Chahal",
        "Jasprit Bumrah", "Mohammed Shami", "Mohammed Siraj", "Shardul Thakur", "Ravindra Jadeja",
        "Ravichandran Ashwin", "Nathan Lyon", "Pat Cummins", "Mitchell Starc", "Josh Hazlewood",
        "Scott Boland", "Cameron Green", "Steve Smith", "Marnus Labuschagne", "Usman Khawaja",
        "Travis Head", "David Warner", "Aaron Finch", "Mitchell Johnson", "Brett Lee",
        "Ricky Ponting", "Sachin Tendulkar", "Rahul Dravid", "Sourav Ganguly", "VVS Laxman",
        "Mahendra Singh Dhoni", "Yuvraj Singh", "Harbhajan Singh", "Zaheer Khan", "Anil Kumble",
        "Kapil Dev", "Sunil Gavaskar", "Viv Richards", "Brian Lara", "Sachin Tendulkar",
        "Ricky Ponting", "Brian Lara", "Muttiah Muralitharan", "Shane Warne", "Wasim Akram",
        "Waqar Younis", "Allan Donald", "Curtly Ambrose", "Malcolm Marshall", "Dale Steyn",
        "James Anderson", "Stuart Broad", "Glenn McGrath", "Shoaib Akhtar", "Brett Lee",
        "Jacques Kallis", "Kumar Sangakkara", "Mahela Jayawardene", "Inzamam-ul-Haq", "Younis Khan",
        "AB de Villiers", "Hashim Amla", "Graeme Smith", "Ricky Ponting", "Matthew Hayden",
        "Adam Gilchrist", "Justin Langer", "Steve Waugh", "Mark Waugh", "Michael Clarke",
        "Andrew Flintoff", "Kevin Pietersen", "Alastair Cook", "Michael Vaughan", "Graeme Swann",
        "Shane Watson", "David Hussey", "Michael Hussey", "Ricky Ponting", "Sachin Tendulkar",
        "Rahul Dravid", "Sourav Ganguly", "VVS Laxman", "Mahendra Singh Dhoni", "Yuvraj Singh",
        "Harbhajan Singh", "Zaheer Khan", "Anil Kumble", "Kapil Dev", "Sunil Gavaskar",
        "Sachin Tendulkar", "Virat Kohli", "Rohit Sharma", "Shubman Gill", "KL Rahul",
        "Babar Azam", "Mohammad Rizwan", "Imam-ul-Haq", "Fakhar Zaman", "Shaheen Afridi",
        "Jos Buttler", "Jonny Bairstow", "Ben Stokes", "Joe Root", "Eoin Morgan",
        "Kane Williamson", "Ross Taylor", "Martin Guptill", "Trent Boult", "Tim Southee",
        "Quinton de Kock", "Faf du Plessis", "Dale Steyn", "AB de Villiers", "Hashim Amla",
        "Lasith Malinga", "Angelo Mathews", "Kumar Sangakkara", "Mahela Jayawardene", "Sanath Jayasuriya",
        "Sourav Ganguly", "Rahul Dravid", "Sachin Tendulkar", "Virender Sehwag", "Gautam Gambhir"
    ]

    if num_rows > len(player_names):
        raise ValueError("Number of rows requested exceeds available player names. Add more names to the list.")

    selected_names = random.sample(player_names, num_rows)

    data = []
    for name in selected_names:
        matches = random.randint(10, 50)

        phases = ["Early", "Middle", "Death"]
        phase_stats = {}
        for phase in phases:
            while True:  # Loop until valid stats are generated
                runs = random.randint(100, 800)
                balls_faced = random.randint(80, 600)
                average = round(runs / matches, 2) if matches > 0 else 0
                strike_rate = round((runs / balls_faced) * 100, 2) if balls_faced > 0 else 0
                if average <= 50 and 90 <= strike_rate <= 170:
                    break  # Exit loop if stats are valid

            phase_stats[phase] = {"runs": runs, "balls_faced": balls_faced, "average": average, "strike_rate": strike_rate}

        data.append({
            "Name": name,
            "Early Overs Average": phase_stats["Early"]["average"],
            "Early Overs Strike Rate": phase_stats["Early"]["strike_rate"],
            "Middle Overs Average": phase_stats["Middle"]["average"],
            "Middle Overs Strike Rate": phase_stats["Middle"]["strike_rate"],
            "Death Overs Average": phase_stats["Death"]["average"],
            "Death Overs Strike Rate": phase_stats["Death"]["strike_rate"],
        })

    df = pd.DataFrame(data)
    return df

num_rows_to_generate = 100
df = generate_t20i_data(num_rows_to_generate)

df.to_csv("all_phase_stats.csv", index=False)
print("all_phase_stats.csv created successfully!")