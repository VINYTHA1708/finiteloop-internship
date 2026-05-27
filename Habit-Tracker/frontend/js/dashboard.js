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

        setTimeout(() => {

            const el =
                document.getElementById(
                    "userDisplay"
                );

            if (el) {

                el.innerText =
                    user.username
                        .toUpperCase();

            }

        }, 50);

    }

}


async function loadDashboard() {

    requireLogin();

    /*
    LOAD NAVBAR FIRST
    */

    await loadNavbar();

    const user =
        getUser();

    const habits =
        await apiCall(
            "/habits"
        );

    if (!habits) {

        return;

    }

    /*
    SHOW ONLY CURRENT USER
    */

    const userHabits =
        habits.filter(
            h =>
                h.user &&
                Number(
                    h.user.userId
                ) ===
                Number(
                    user.userId
                )
        );

    renderStats(
        userHabits
    );

    renderTable(
        userHabits
    );

}


function renderStats(
    habits
) {

    document
        .getElementById(
            "total"
        )
        .innerText =
        habits.length;

    const today =
        new Date()
            .toISOString()
            .split(
                "T"
            )[0];

    const completed =
        habits.filter(
            h =>

                h.completedToday === true

                &&

                h.completedDate === today

        ).length;

    document
        .getElementById(
            "completed"
        )
        .innerText =
        completed;

    const streak =
        Math.max(
            ...habits.map(
                h =>
                    h.currentStreak || 0
            ),
            0
        );

    document
        .getElementById(
            "streak"
        )
        .innerText =
        streak;

}


function renderTable(
    habits
) {

    const table =
        document.getElementById(
            "habitTable"
        );

    table.innerHTML =
        "";

    const today =
        new Date()
            .toISOString()
            .split(
                "T"
            )[0];

    habits.forEach(
        h => {

            const done =

                h.completedToday === true

                &&

                h.completedDate === today;

            table.innerHTML += `

<tr>

<td>
${h.habitName}
</td>

<td>
${h.category}
</td>

<td>
${done ? "✅ Done" : "❌ Pending"}
</td>

</tr>

`;

        }
    );

}