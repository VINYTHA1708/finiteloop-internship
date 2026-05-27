const BASE_URL =
    "http://localhost:8080/api";

async function apiCall(
    url,
    method = "GET",
    body = null
) {

    try {

        const options = {

            method,

            headers: {
                "Content-Type":
                    "application/json"
            }

        };

        if (body) {

            options.body =
                JSON.stringify(
                    body
                );

        }

        const response =
            await fetch(
                BASE_URL + url,
                options
            );

        const text =
            await response.text();

        if (!response.ok) {

            console.error(
                text
            );

            throw new Error(
                "Server Error"
            );

        }

        if (
            text &&
            text.trim() !== ""
        ) {

            return JSON.parse(
                text
            );

        }

        return null;

    }

    catch (error) {

        console.error(
            error
        );

        return null;

    }

}