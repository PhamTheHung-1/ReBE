function oth(role) {
    return(req, rep, done) =>{
        if(req.user && req.user.role && req.user.role === role){
            done();
        }else{
            rep.send(`Bạn không được phép truy cập trang này, chi có ${role} mới được sử dụng`);
        }
    }
}

module.exports = oth;