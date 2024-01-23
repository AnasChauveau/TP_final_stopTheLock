
document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('http://localhost:3000/api/auth/local', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            identifier: email,
            password
        }),
    });
    const data = await response.json();
    if(data.token){
        localStorage.setItem("token", data.token);
        document.location.href="pageJeu.html";
    }else{
        alert("non");
    }
});


const token = localStorage.getItem('token');

if (token) {
    document.location.href="pageJeu.html";
}

