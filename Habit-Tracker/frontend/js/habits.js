async function loadNavbar() {

    const response =
        await fetch(
            "../components/navbar.html"
        );

    document
        .getElementById(
            "navbar"
        )
        .innerHTML =
        await response.text();

    const user =
        getUser();

    if (
        user &&
        user.username
    ) {

        const el =
            document
                .getElementById(
                    "userDisplay"
                );

        if (el) {

            el.innerText =
                user.username
                    .toUpperCase();

        }

    }

}


async function addHabit() {

    const currentUser =
        getUser();

    if (!currentUser) {

        alert(
            "Login again"
        );

        location.href =
            "login.html";

        return;

    }

    const data = {

        habitName:
            document
                .getElementById(
                    "habitName"
                ).value,

        category:
            document
                .getElementById(
                    "category"
                ).value,

        targetDays:
            parseInt(
                document
                    .getElementById(
                        "targetDays"
                    ).value
            ),

        completedToday:
            false,

        currentStreak:
            0,

        user: {

            userId:
                currentUser.userId

        }

    };

    console.log(
        data
    );

    await apiCall(
        "/habits",
        "POST",
        data
    );

    alert(
        "Habit Added"
    );

    location.href =
        "habits.html";

}


async function loadHabits() {

    requireLogin();

    await loadNavbar();

    const user =
        getUser();

    const habits =
        await apiCall(
            "/habits"
        );

    if (!habits) {

        renderHabits(
            []
        );

        return;

    }

    const filtered =
        habits.filter(
            habit =>
                habit.user &&
                Number(
                    habit.user.userId
                ) ===
                Number(
                    user.userId
                )
        );

    renderHabits(
        filtered
    );

}


function renderHabits(
    habits
) {

    const body =
        document.getElementById(
            "habitBody"
        );

    body.innerHTML =
        "";

    if (
        habits.length === 0
    ) {

        body.innerHTML =
            `
<tr>
<td colspan="6">
No habits found
</td>
</tr>
`;

        return;

    }

    const today =
        new Date()
            .toISOString()
            .split(
                "T"
            )[0];

    habits.forEach(
        (h) => {

            const done =

                h.completedToday === true &&

                h.completedDate === today;

            body.innerHTML += `

<tr>

<td>${h.habitName}</td>

<td>${h.category}</td>

<td>${h.targetDays}</td>

<td>

${done
? "✅"
: `<button onclick="completeHabit(${h.habitId})">
Complete
</button>`
}

</td>

<td>

${h.currentStreak || 0}

</td>

<td>

<button onclick="editHabit(${h.habitId})">
Edit
</button>

<button onclick="deleteHabit(${h.habitId})">
Delete
</button>

</td>

</tr>

`;

        }

    );

}


async function completeHabit(id) {

    const habits =
        await apiCall(
            "/habits"
        );

    const h =
        habits.find(
            x =>
                Number(
                    x.habitId
                ) ===
                Number(
                    id
                )
        );

    if (!h) {

        alert(
            "Habit not found"
        );

        return;

    }

    const updatedHabit = {

        habitId:
            h.habitId,

        habitName:
            h.habitName,

        category:
            h.category,

        targetDays:
            h.targetDays,

        completedToday:
            true,

        currentStreak:
            Number(
                h.currentStreak || 0
            ) + 1,

        completedDate:
            new Date()
                .toISOString()
                .split(
                    "T"
                )[0],

        user: {
            userId:
                h.user.userId
        }

    };

    console.log(
        updatedHabit
    );

    await apiCall(

        "/habits/" + id,

        "PUT",

        updatedHabit

    );

    location.reload();

}


async function editHabit(id){

const habits =
await apiCall(
"/habits"
);

const h =
habits.find(
x =>
Number(x.habitId) === Number(id)
);

if(!h){

alert(
"Habit not found"
);

return;

}

const habitName =
prompt(
"Edit Habit Name",
h.habitName
);

if(habitName===null)
return;

const category =
prompt(
"Edit Category",
h.category
);

if(category===null)
return;

const targetDays =
prompt(
"Edit Target Days",
h.targetDays
);

if(targetDays===null)
return;

const completed =
confirm(
"Completed Today?\nOK = Yes\nCancel = No"
);

const streak =
prompt(
"Edit Current Streak",
h.currentStreak
);

if(streak===null)
return;

const updatedHabit = {

habitId:
h.habitId,

habitName:
habitName,

category:
category,

targetDays:
Number(
targetDays
),

completedToday:
completed,

currentStreak:
Number(
streak
),

completedDate:
completed
?

new Date()
.toISOString()
.split(
"T"
)[0]

:

null,

user:{
userId:
h.user.userId
}

};

await apiCall(

"/habits/"+id,

"PUT",

updatedHabit

);

alert(
"Habit Updated"
);

loadHabits();

}

async function deleteHabit(
    id
) {

    await apiCall(

        "/habits/" + id,

        "DELETE"

    );

    loadHabits();

}