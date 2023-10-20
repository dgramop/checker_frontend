import logo from './logo.svg';
import './App.scss';
import {createContext, useContext, useEffect, useState} from 'react';
import {Add, Check, Close, Delete} from '@mui/icons-material';
import {BrowserRouter, Link, Route, Routes} from 'react-router-dom';

function Workshop({workshop, taken, removeWorkshop}) {
	return (
		<div className="card--decision__workshops__workshop">
			<div className="card--decision__workshops__workshop__name">{workshop.name}</div>
			<Delete onClick={() => removeWorkshop(taken.member, taken.workshop)} className="card--decision__workshops__workshop__delete"/>
		</div>
	)
}

const CheckInContext = createContext({workshops:[],setWorkshops:()=>{}})

async function submitWorkshop(workshop_id, taker_gnum) {
	//TODO: submit workshop with id and teacher
	
	let takeresp = await fetch(`/api/members/${taker_gnum}/workshop/${workshop_id}`, {method:"POST"})
	let takedata = await takeresp.json();

	if(takedata == "AlreadyTook") {
		return false
	} else {
		return takedata;
	}
}

function Decision({decision}) {
	let [addWorkshop, setAddWorkshop] = useState(false);
	let [memberWorkshops, setMemberWorkshops] = useState(decision?.workshops)
	const {workshops} = useContext(CheckInContext);

	let removeWorkshop = async (member, workshop) => {
		try {
			let ws = await fetch(`/api/members/${member}/workshop/${workshop}`, {method:"DELETE"});
			let wsdat = await ws.json()

			setMemberWorkshops(memberWorkshops.filter((ws) => ws[1].id !== workshop))
			return true;
		} catch(e) {
			return false;
		}
	}

	useEffect(()=> {
		if(decision?.entry === "Disallow") {
		} else if(decision?.entry === "Allow") {
		}
	}, [decision?.entry]) 

	if (decision?.entry === "Allow") {
		return (
			<div className={"card card--decision--accept"}>
				<div className={"card__header"}>
					<div className={"card--decision--accept__symbol"}>
						<Check />
					</div>
					<div className={"card__header__title"}>
						{decision.name}
					</div>
				</div>

				<div className="card--decision__workshops__container">
					<div className="card--decision__workshops__title">Workshops</div>
					<div className="card--decision__workshops">
						{memberWorkshops?.map((workshop) => <Workshop removeWorkshop={removeWorkshop} key={workshop[1].name} taken={workshop[0]} workshop={workshop[1]} />)}
						<div role="button" onClick={() => {setAddWorkshop(true)}} className="card--decision__workshops__workshop card--decision__workshops__workshop--add">
							{!addWorkshop && <Add />}
							{addWorkshop &&
								<select onChange={async (e) => {let addl = await submitWorkshop(e.target.value, decision.gnum); if(addl) {setMemberWorkshops([...memberWorkshops, addl]); setAddWorkshop(false)}}}>
									<option>Select Workshop...</option>
									{workshops.map((workshop) => <option value={workshop.id}>{workshop.name}</option>)}
								</select>
							}
						</div>
					</div>
				</div>
				<small><i>G{decision.gnum.toString().padStart(8,'0')}</i></small>
			</div>
			)
		}
		else if (decision?.entry === "Disallow") {
			return (
				<div className={"card card--decision--reject"}>
					<div className={"card__header"}>
						<div className={"card--decision--reject__symbol"}>
							<Close /> 
						</div>
						<div className={"card__header__title"}>
							{decision.card_number}
						</div>
					</div>
					{decision.entry === "Disallow" && <div dangerouslySetInnerHTML={{__html: decision.html}}></div>}
					</div>
			)
		} else {
			return (
				<div className={"card card--decision--loading"}>

					<div className={"card__header"}>
						<div className={"card--decision--loading__symbol"}>
							<Close />
						</div>
						<div className={"card__header__title card__header__title--loading"}>
						</div>
					</div>

				</div>
			)
		}
}

function CheckInPage() {
	// TODO: migration utility to add workshops to checked-in customers
	// TODO: utility to check people into workshops

	let [cardNo, setCardNo] = useState("");

	let [loading, setLoading] = useState(false)
	let [decisions, setDecisions] = useState([])

	let [workshops, setWorkshops] = useState([]);

	useEffect(() => {
		let load_workshops = async () => {
			let workshopsresp = await fetch("/api/workshops");
			let workshopsdata = await workshopsresp.json();
			setWorkshops(workshopsdata)
		}

		load_workshops()
	}, [])

	let checkIn = async () => {
		try {
			setLoading(true)
			let resp = await fetch(`/api/check_in/${cardNo}`, {method: "POST"})
			let res = await resp.json();

			if(res.entry === "Disallow") {
				let alarm = new Audio("alarm.ogg")
				alarm.play()
				setTimeout(() => alarm.pause(), 1000);
			} else if (res.entry === "Allow") {
				let ding = new Audio("ding.mp3")
				ding.play()
				setTimeout(() => ding.pause(), 2000);
			}

			setCardNo("");
			setDecisions([{...res,card_number: cardNo, date:Date.now()}, ...decisions])
			setLoading(false)
		} catch (e) {
			setLoading(false)
			setCardNo("");
			console.log(e)
		}

	}

  return (
		<CheckInContext.Provider value={{workshops, setWorkshops}}>
			<div className="alley">
				<div className="card tap_form__container">
					<div className="tap_form__title">MIX Check In</div>
					<form className="tap_form" onSubmit={(e) => {e.preventDefault(); checkIn()}}>
						<input value={cardNo} className="huge" autoFocus={true} type="text" onChange={(e) => setCardNo(e.target.value)} placeholder="Enter NetId or Tap a Card"/>
					</form>
					<div className="tap_form__links"><Link to="/panel">Control Panel</Link></div>
				</div>
				{loading && <Decision/>}
				{decisions && decisions.map(
					(decision) => {return (<Decision key={decision.date} decision={decision}/>)}
				)}
			</div>
		</CheckInContext.Provider>
  );
}

function Panel() {
	const [workshopName, setWorkshopName] = useState("");
	const [workshops, setWorkshops] = useState([]);

	let load_workshops = async () => {
		let workshopsresp = await fetch("/api/workshops");
		let workshopsdata = await workshopsresp.json();
		setWorkshops(workshopsdata)
	}

	useEffect(() => {
		load_workshops()
	}, [])

	let createWorkshop = async (workshop_name) => {
		let f = new FormData();
		f.append("name", workshop_name)
		let workshopresp = await fetch("/api/workshops/", {method:"POST", body:f})
		await workshopresp.text()
		setWorkshopName("");
		load_workshops()
	}

	let deleteWorkshop = async (workshop_id) => {
		let workshopresp = await fetch(`/api/workshops/${workshop_id}`, {method:"DELETE"})
		await workshopresp.text()
		setWorkshopName("");
		load_workshops()
	}

	return (<>
		<div className="alley">
			<div className="card">
				<div className="card__header">
					<div className="card__header__title">
						Manage Workshops
					</div>
				</div>
				<form className="ctrl_workshop_form" onSubmit={(e) => {createWorkshop(workshopName); e.preventDefault()}} >
					<input placeholder={"Welding"} value={workshopName} onChange={(e) => setWorkshopName(e.target.value)} type="text"/>
				</form>

				<div className="ctrl_workshops">
					{workshops.map((workshop) => 
						<div key={workshop.name} className="ctrl_workshops__workshop">
							<div className="ctrl_workshops__workshop__title"> 
								{workshop.name}
							</div>
							<div onClick={() => deleteWorkshop(workshop.id)} role="button" className="ctrl_workshops__workshop__delete"> 
								<Delete />
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	</>)
}

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" index element={<CheckInPage/>} />
				<Route path="/panel" element={<Panel />} />
			</Routes>
		</BrowserRouter>
	)
}

export default App;
