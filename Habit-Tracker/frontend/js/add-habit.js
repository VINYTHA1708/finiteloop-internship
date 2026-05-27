async function addHabit() {

    const user =
        JSON.parse(
            localStorage.getItem(
                "user"
            )
        );

    if (!user) {

        alert(
            "Please login first"
        );

        window.location.href =
            "login.html";

        return;

    }

    const data = {

        userId:
            user.userId,

        habitName:
            document.getElementById(
                "habitName"
            ).value,

        category:
            document.getElementById(
                "category"
            ).value,

        targetDays:
            parseInt(
                document.getElementById(
                    "targetDays"
                ).value
            ),

        completedToday:
            false,

        currentStreak:
            0

    };

    try {

        const response =
            await fetch(
                "http://localhost:8080/api/habits",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            data
                        )

                }
            );

        if (
            response.ok
        ) {

            alert(
                "Habit Added Successfully"
            );

            window.location.href =
                "habits.html";

        }

        else {

            const error =
                await response.text();

            console.log(
                error
            );

            alert(
                "Request Failed"
            );

        }

    }

    catch (
        error
    ) {

        console.log(
            error
        );

        alert(
            "Server Error"
        );

    }

    console.log(
        data
    );

}