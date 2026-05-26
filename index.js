import axios from "axios";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";



async function main(){
    const MONGODB_CONN_STRING = "mongodb://127.0.0.1:27017/trek-it?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.5.1"

    // const MONGODB_CONN_STRING = "mongodb+srv://codewithprashant308_db_user:mTPhHz6zfltk8ucC@cluster0.lpkbvcf.mongodb.net/trek-it?appName=Cluster0"

    // connect and clear data of all collection
    try {
        console.log("Connecting to mongodb");
        const conn = await mongoose.connect(MONGODB_CONN_STRING);
        console.log(`Successfully connected to ${conn.connection.host}`);

        const db = conn.connection.db;
        const collections = await db.listCollections().toArray();

        for (const col of collections) {
            await db.collection(col.name).deleteMany({});
            console.log(`Cleared: ${col.name}`);
        }

        console.log("All collections cleared.");
    } catch (error) {
        console.log("Error: ", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }


    const axiosI = axios.create({
        baseURL: "http://localhost:4000",
        withCredentials: true,
    });

    let currentToken = null;

    const authHeader = () => ({
        headers: { Authorization: `Bearer ${currentToken}` }
    });

    const login = async (body) => {
        const res = await axiosI.post("/api/auth/login", body);
        const cookieHeader = res.headers['set-cookie']?.[0];
        currentToken = cookieHeader?.split(';')[0]?.split('=')?.[1];
        console.log(`  Token: ${currentToken ? "Yes" : "No"}`);
        return res;
    }

    const logout = async () => {
        await axiosI.post("/api/auth/logout", {}, authHeader());
        currentToken = null;
    }

    const registerGuide = async (body) => {
        try{
            const formData = new FormData();

            for(const [key, val] of Object.entries(body)){
                if (key === "profilePicture") {
                    formData.append("profilePicture", val, "pfp.jpg");
                }else if(Array.isArray(val)){
                    val.forEach( v => formData.append(key, v));
                } else if (val !== null && typeof val === "object") {
                    for (const [nestedKey, nestedVal] of Object.entries(val)) {
                        formData.append(`${key}.${nestedKey}`, nestedVal);
                    }
                }else{
                    formData.append(key, val);
                }
            }

            return await axiosI.post("/api/auth/guide", formData, authHeader())
        }catch(err){
            console.log("Raw error response:", err.response?.data);
            console.log("Status:", err.response?.status);
            throw err;
        }
    }

    const createPackage = async (body) => {
        try {
            const formData = new FormData();

            for (const [key, val] of Object.entries(body)) {
                if (key === "packageImage") {
                    val.forEach((blob, i) => formData.append("packageImage", blob, `img${i}.jpg`));
                } else if (Array.isArray(val)) {
                    val.forEach(v => formData.append(key, v));
                } else {
                    formData.append(key, val);
                }
            }

            return await axiosI.post("/api/packages", formData, authHeader());
        } catch (err) {
            console.log("Raw error response:", err.response?.data);
            console.log("Status:", err.response?.status);
            throw err;
        }
    }

    // ---- data ----

    const regions = ["Kathmandu", "Dharan", "Annapurna", "Everest", "Pokhara"];
    const languages = ["English", "Nepali", "German", "Danish", "Korean", "Japanese"];
    const packageTypes = ["regular", "custom", "shared"];
    const activities = ["trekking", "camping", "photography", "wildlife", "cultural immersion"];

    const guideNames = [
        { name: "Bikram Thapa",     gender: "male"   },
        { name: "Sita Gurung",      gender: "female" },
        { name: "Ramesh Lama",      gender: "male"   },
        { name: "Anita Shrestha",   gender: "female" },
        { name: "Prakash Rai",      gender: "male"   },
        { name: "Sunita Tamang",    gender: "female" },
        { name: "Dipesh Magar",     gender: "male"   },
        { name: "Kabita Limbu",     gender: "female" },
        { name: "Jasmine Adhikari", gender: "female" },
        { name: "Prashant Shrestha",gender: "male"   },
        { name: "Nikesh Dhimal",    gender: "male"   },
    ];

    const packageNames = [
        "Everest Base Camp Trek", "Annapurna Circuit",
        "Langtang Valley Trek", "Mustang Explorer",
        "Gosaikunda Lake Trek", "Manaslu Circuit",
        "Kanchenjunga Base Camp", "Rara Lake Trek"
    ];

    const states = ["Bagmati", "Gandaki", "Koshi", "Lumbini", "Karnali"]

    const images = [
        "./imgs/img1.jpg",
        "./imgs/img2.jpg",
        "./imgs/img3.jpg",
        "./imgs/img4.jpg",
        "./imgs/img5.jpg",
    ];

    const menPfps = [
        "./imgs/profile/men/men1.jpg",
        "./imgs/profile/men/men2.jpg",
        "./imgs/profile/men/men3.jpg",
        "./imgs/profile/men/men4.jpg",
        "./imgs/profile/men/men5.jpg",
        "./imgs/profile/men/men6.jpg",
        "./imgs/profile/men/men7.jpg",
    ]

    const womenPfps = [
        "./imgs/profile/women/women1.jpg",
        "./imgs/profile/women/women2.jpg",
        "./imgs/profile/women/women3.jpg",
        "./imgs/profile/women/women4.jpg",
        "./imgs/profile/women/women5.jpg",
        "./imgs/profile/women/women6.jpg",
        "./imgs/profile/women/women7.jpg",
    ]


    // ---- helpers ----

    const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min)) + min;
    const pickRandom = (arr, count) => [...arr].sort(() => Math.random() - 0.5).slice(0, count);

    const getImage = () => {
        const index = getRandomNumber(0, images.length);
        const imgPath = images[index];
        const buffer = fs.readFileSync(imgPath);
        const filename = path.basename(imgPath);
        return new Blob([buffer], { type: "image/jpeg" });
    }

    const getImages = () => {
        const randomNum = getRandomNumber(1, 4);
        const packageImages = [];
        for (let i = 0; i < randomNum; i++) {
            packageImages.push(getImage());
        }
        return packageImages;
    }

    const getPfp = (gender)=>{
        let imgPath;

        if(gender === "male" ){
            imgPath = menPfps[getRandomNumber(0, menPfps.length - 1)];
        }else{
            imgPath = womenPfps[getRandomNumber(0, womenPfps.length - 1)];
        }

        const buffer = fs.readFileSync(imgPath);
        const filename = path.basename(imgPath);

        return new Blob([buffer], { type: "image/jpeg" });

    }

    const generateGuide = (guide, index) => {

        return({
            name: guide.name,
            email: `guide${index}${Date.now()}@trek.com`,
            password: "Password123!",
            role: "guide",
            gender: guide.gender,
            age: getRandomNumber(25, 55),
            phone: `98${getRandomNumber(10000000, 99999999)}`,
            address: {
                country: "Nepal",
                state: pickRandom(states, 1)[0]
            },
            languages: pickRandom(languages, getRandomNumber(1, 3)),
            regions: pickRandom(regions, getRandomNumber(1, 3)),
            profilePicture: getPfp(guide.gender)
        })
    }

    const generatePackage = (name) => ({
        name,
        description: `A beautiful trek through Nepal's stunning ${name} route, featuring breathtaking views and cultural experiences.`,
        keywords: JSON.stringify(pickRandom(["adventure", "nature", "culture", "altitude", "scenic", "classic"], 3)),
        regions: JSON.stringify(pickRandom(regions, getRandomNumber(1, 3))),
        activities: JSON.stringify(pickRandom(activities, getRandomNumber(1, 3))),
        type: packageTypes[getRandomNumber(0, packageTypes.length)],
        startingPrice: getRandomNumber(200, 800),
        pricePerPerson: getRandomNumber(80, 250),
        maxGroupSize: getRandomNumber(5, 15),
        daysAlloted: getRandomNumber(7, 21),
        requiresPermit: Math.random() > 0.5,
        packageImage: getImages(),
    });

    // ---- seed ----

    const seed = async () => {
        const selectedGuides = pickRandom(guideNames, getRandomNumber(7, guideNames.length));
        console.log(`Creating ${selectedGuides.length} guides...\n`);

        for (let i = 0; i < selectedGuides.length; i++) {
            const guide = selectedGuides[i];
            const guideData = generateGuide(guide, i);

            try {
                console.log(`[${i + 1}/${selectedGuides.length}] ${guide.name}`);

                await registerGuide(guideData);
                console.log(`  Registered: [Done]`);

                await login({ email: guideData.email, password: guideData.password });
                console.log(`  Logged in: [Done]`);

                const selectedPackages = pickRandom(packageNames, getRandomNumber(1, 4));
                console.log(`  Creating ${selectedPackages.length} packages...`);

                for (const pkgName of selectedPackages) {
                    await createPackage(generatePackage(pkgName));
                    console.log(`    [Created]: ${pkgName}`);
                }

                await logout();
                console.log(`  Logged out \n`);

            } catch (err) {
                console.error(` [Failed]:`, err.response?.data?.message || err.message);
                await logout().catch(() => {});
                currentToken = null;
            }
        }

        console.log("Seeding complete.");
    }

    await seed();
}



(async () => {
    console.warn("DATA OF ALL COLLECTIONS IN THE TREK-IT DB WILL BE CLEARED.\n\n");

    let countdown = 5;
    
    await new Promise((resolve) => {
        const interval = setInterval(() => {
            process.stdout.write(`\rExecuting in ${countdown} seconds... Press CTRL+C to cancel `);
            countdown--;

            if (countdown < 0) {
                clearInterval(interval);
                process.stdout.write("\n");
                resolve();
            }
        }, 1000);
    });

    await main();
    process.exit(0);
})();
