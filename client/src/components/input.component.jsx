

const InputBox = ({name ,type ,id ,value, placeholder}) =>{
    return (
        <div className="relative w-[100%] mb-5">
            <input 
                name ={name}
                type= {type}
                placeholder={placeholder}
                defaultValue={value}
                id={id}
                className="input-box"
                required
                />

            <i className="fi fi-rr-user input-icon"></i>
        </div>
    )
}

export default InputBox;