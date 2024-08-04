const User = require('../../Model/User');

exports.postSignup = async (req, res) => {
    const { email, preferences } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            res.status(400).json({ msg: 'user already exist' });
        };

        user = new User({
            email,
            preferences
        });

        await user.save();
        req.session.user = user;
        res.redirect('/')
    } catch (error) {
        console.log(error)
        res.status(500).send('Server Error')
    }
};

exports.postSignin = async (req, res) => {
    const { email } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ msg: 'User does not exist' });
        }
        req.session.user = user;
       res.redirect('/')

    } catch (error) {
        console.log(error)
        res.status(500).send('Server Error')
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err)
        }
    })
    res.redirect("/");
}