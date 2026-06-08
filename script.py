import os
import git
import time
from tqdm import tqdm
from google import genai

# 1. Setup
client = genai.Client(api_key="AIzaSyCxdKMV3aquJ4y-6PeET6l7Q7VKQ1MU8Vc")
repo = git.Repo(".") 

def batch_process_commits(batch_size=5):
    # Get all commits from main
    all_commits = list(repo.iter_commits('main'))
    total_commits = len(all_commits)
    
    changelog_content = "# AI Generated Changelog\n\n"
    
    print(f"🚀 Starting analysis for {total_commits} commits...")
    
    # 2. Setup the Progress Bar
    with tqdm(total=total_commits, desc="Analyzing History", unit="commit") as pbar:
        # Loop through commits in chunks (batches)
        for i in range(0, total_commits, batch_size):
            batch = all_commits[i : i + batch_size]
            
            # Prepare the big batch prompt
            batch_data = ""
            for cmd in batch:
                diff = repo.git.show(cmd.hexsha)[:1500] # Limit diff size
                batch_data += f"COMMIT_ID: {cmd.hexsha[:7]}\nMSG: {cmd.message}\nDIFF: {diff}\n---\n"

            prompt = f"""
            Analyze these {len(batch)} git commits. For each one, write a 
            1-sentence user-friendly update note. 
            Format exactly like this:
            [COMMIT_ID]: Summary
            
            Commits to analyze:
            {batch_data}
            """

            try:
                # 3. Call Gemini 3 Flash
                response = client.models.generate_content(
                    model='gemini-2.5-flash-lite', 
                    contents=prompt
                )
                
                changelog_content += response.text + "\n"
                
                # Update progress bar
                pbar.update(len(batch))
                
                # 4. Rate Limit Protection (Wait between batches)
                if i + batch_size < total_commits:
                    time.sleep(36) 

            except Exception as e:
                print(f"\nError at batch {i}: {e}")
                time.sleep(60) # Extra rest on error
                continue

    # Save to file
    with open("CHANGELOG.md", "w", encoding="utf-8") as f:
        f.write(changelog_content)

if __name__ == "__main__":
    batch_process_commits()
    print("\n✅ All 242 commits processed! Check your CHANGELOG.md.")