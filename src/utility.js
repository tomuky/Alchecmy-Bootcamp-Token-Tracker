const hasSpecialChar = (str) => {
    let regex = /[@!#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
    return regex.test(str);
}

export {
    hasSpecialChar
}