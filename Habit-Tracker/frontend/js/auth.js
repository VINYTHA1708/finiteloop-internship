async function register() {

    const username =
        document
            .getElementById(
                "username"
            ).value;

    const email =
        document
            .getElementById(
                "email"
            ).value;

    const password =
        document
            .getElementById(
                "password"
            ).value;

    if (
        !username ||
        !email ||
        !password
    ) {

        alert(
            "Fill all fields"
        );

        return;

    }

    await apiCall(

        "/auth/register",

        "POST",

        {
            username,
            email,
            password
        }

    );

    alert(
        "Registered"
    );

    location.href =
        "login.html";

}


async function login() {

    const email =
        document
            .getElementById(
                "email"
            ).value;

    const password =
        document
            .getElementById(
                "password"
            ).value;

    const user =
        await apiCall(
            "/auth/login",
            "POST",
            {
                email,
                password
            }
        );

    console.log(
        "LOGIN RESPONSE:",
        user
    );

    if (
        user &&
        user.userId
    ) {

        localStorage.setItem(
            "user",
            JSON.stringify(
                user
            )
        );

        location.href =
            "dashboard.html";

    }

    else {

        alert(
            "Invalid Email or Password"
        );

    }

}


function logout() {

    localStorage
        .removeItem(
            "user"
        );

    location.href =
        "login.html";

}


function getUser() {

    return JSON.parse(

        localStorage
            .getItem(
                "user"
            )

    );

}


function requireLogin() {

    if (
        !getUser()
    ) {

        location.href =
            "login.html";

    }

}