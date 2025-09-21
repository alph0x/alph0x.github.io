# 📄 Update Your Real Experience

## 🎯 How to Update with Your Real Information

### Step 1: Update Personal Information

Edit `Resources/Information/personal.json` with your real data from your PDF/LinkedIn:

```json
{
    "user_string": "Alfredo E. Pérez Leal",
    "title_string": "Your Real Degree",
    "current_role_string": "Your Current Job Title",
    "trayectory": [
        {
            "logo": "/images/company-logos/your-current-company.png",
            "name": "Your Current Company Name",
            "dates": {
                "start": "Start Date",
                "end": "Present"
            },
            "roles": [
                {
                    "title": "Your Current Position",
                    "duties": [
                        "Your real responsibility 1",
                        "Your real responsibility 2",
                        "Your real responsibility 3",
                        "etc..."
                    ]
                }
            ]
        },
        {
            "logo": "/images/company-logos/previous-company.png",
            "name": "Previous Company Name",
            "dates": {
                "start": "Start Date",
                "end": "End Date"
            },
            "roles": [
                {
                    "title": "Previous Position",
                    "duties": [
                        "Previous responsibility 1",
                        "Previous responsibility 2",
                        "etc..."
                    ]
                }
            ]
        }
    ]
}
```

### Step 2: Add Company Logos

Add your real company logos to:
- `Public/images/company-logos/your-current-company.png`
- `Public/images/company-logos/previous-company.png`

### Step 3: Update Skills

The skills are already categorized and quantified. Adjust the levels (0-100) based on your self-assessment:

```json
"skills_categories": [
    {
        "category": "iOS Development",
        "items": [
            {"name": "Swift", "level": 95},
            {"name": "SwiftUI", "level": 90},
            // Adjust levels as needed
        ]
    }
]
```

### Step 4: Regenerate and Deploy

```bash
# After updating the JSON with your real information:
./generate-static.sh

# Commit and deploy:
git add .
git commit -m "feat: update with real professional experience"
git push
```

## 📋 Information Needed from Your PDF/LinkedIn

Please update these fields with your real information:

- [ ] **Current Company Name**
- [ ] **Current Job Title**
- [ ] **Current Job Start Date**
- [ ] **Current Job Responsibilities** (3-6 bullet points)
- [ ] **Previous Companies** (in chronological order)
- [ ] **Previous Roles and Dates**
- [ ] **Previous Responsibilities**
- [ ] **Education Details** (if different from B.Sc. Computer Science)
- [ ] **Real Social Media URLs** (if different from @alph0x)

## 🔄 Current Template Structure

The JSON is set up with placeholder information that you can easily replace:

- ✅ **Apple-style design** ready
- ✅ **Skills quantification** system in place
- ✅ **Local image hosting** configured
- ✅ **Responsive layout** implemented
- ✅ **Automatic regeneration** working

Just replace the placeholder content with your real information!
