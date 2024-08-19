/* ustalenia
	samochód - {kolor,rejestracja,aktywność}
	miejsce - {kolor, nazwa, typy}

	wpisy:
	- start i koniec (+samochód +przebieg1)
	- załadunek i rozładunek (+miejsce + przebieg1 +typTowaru)
	- tankowanie paliwo i adblue (+miejsce +przebieg1 +ilość)
	- noc start (+miejsce +przebieg)
	- noc koniec
	- zmiana auta (+miejsce +samochód +przebieg1 +przebieg2)
	- serwis start (+miejsce +przebieg)
	- serwis koniec
	- czekanie start i koniec
	- dane (+odstępCzasu1 +odstępCzasu2 +odstępCzasu3)

	konstrukcja wpisu:
	- typ: 1 znak
	- czas: 5 znaków
	- miejsce (opcjonalnie) 2 znaki
	- samochód (opcjonalnie) 2 znaki
	- typ towaru (opcjonalnie) 2 znaki
	- przebieg (opcjonalnie) 5 znaków
	- pojemność (opcjonalnie) 3 znaki
	- odstęp czasu (opcjonalnie) 2 znaki
	- koniec wpisu: znak !
	- koniec pakietu: znak ?

	typy miejsc:
	- sen
	- załadunek
	- rozładunek
	- tankowanie paliwa
	- tankowanie adblue
	- serwis
	- baza

	zasady:
	- samochodów nie da się kasować
	- brak możliwości kasowania miejsc
	- wpisy grupowane w trasę, trasy w systemie są osobne ale w podglądzie grupowane w tygodnie
	- możliwośc przesuwania, kasowania i edycji wpisów ale wymagana spójność do zapisania
	- brak możliwości edycji zapisanych już tras
	- pokazuje ilość wykorzystanych w tygodniu skróconych odpoczynków i wydłużonych czasów jazdy
	- statystyki generowane w locie na podstawie wpisów
	- 
*/
let version = Number(localStorage.getItem("version")||"0")||0
let main = 0
const placeTypes = ["sleep","base","service","loading","unloading","refueling","adblue"]
const placeTypesPL = ["Miejsce Spania","Baza","Serwis","Załadunek","Rozładunek","Tankowanie","Tankowanie AdBlue"]
const typesOfEntries=
{
	// struktura każdego wpisu zawiera czas
	a:
	{
		name: "Start Trasy",
		test: function(package)
		{
			return package.length == 0
		},
		structure:
		[
			{
				required: true,
				namePL: "Ciężarówka",
				name: "car_1",
				code: "identifier",
				length: 2,
				showToUser: "carName",
				default: 0,
				select: "car",
			},
			{
				required: true,
				namePL: "Przebieg",
				name: "mileage_1",
				code: "mileage",
				length: 5,
				showToUser: "mileage",
				default: 0,
				select: "value",
			},
			{
				namePL: "Miejsce",
				name: "place",
				code: "identifier",
				length: 2,
				showToUser: "placeName",
				default: 0,
				select: "place",
				acceptable: ["sleep","base","service","refueling","loading"],
			},
		],
	},
	b:
	{
		name: "Koniec Trasy",
		test: function(package)
		{
			return package.length > 0
		},
		structure:
		[
			{
				required: true,
				namePL: "Przebieg",
				name: "mileage_1",
				code: "mileage",
				length: 5,
				showToUser: "mileage",
				default: 0,
				select: "value",
			},
			{
				namePL: "Miejsce",
				name: "place",
				code: "identifier",
				length: 2,
				showToUser: "placeName",
				default: 0,
				select: "place",
				acceptable: ["sleep","base","service","refueling","loading"],
			},
		],
	},
	c:
	{
		name: "Załadunek",
		test: function(package)
		{
			return package.length > 0
		},
		structure:
		[
			{
				namePL: "Miejsce",
				name: "place",
				code: "identifier",
				length: 2,
				showToUser: "placeName",
				default: 0,
				select: "place",
				acceptable: ["loading"],
			},
			{
				namePL: "Towar",
				name: "product",
				code: "identifier",
				length: 2,
				showToUser: "productName",
				default: 0,
			},
			{
				namePL: "Przebieg",
				name: "mileage_1",
				code: "mileage",
				length: 5,
				showToUser: "mileage",
				default: 0,
				select: "value",
			},
		],
	},
	d:
	{
		name: "Rozładunek",
		test: function(package)
		{
			return package.length > 0
		},
		structure:
		[
			{
				namePL: "Miejsce",
				name: "place",
				code: "identifier",
				length: 2,
				showToUser: "placeName",
				default: 0,
				select: "place",
				acceptable: ["unloading"],
			},
			{
				namePL: "Towar",
				name: "product",
				code: "identifier",
				length: 2,
				showToUser: "productName",
				default: 0,
			},
			{
				namePL: "Przebieg Licznika",
				name: "mileage_1",
				code: "mileage",
				length: 5,
				showToUser: "mileage",
				default: 0,
				select: "value",
			},
		],
	},
	e:
	{
		name: "Tankowanie częściowe",
		test: function(package)
		{
			return package.length > 0
		},
		structure:
		[
			{
				namePL: "Miejsce",
				name: "place",
				code: "identifier",
				length: 2,
				showToUser: "placeName",
				default: 0,
				select: "place",
				acceptable: ["refueling"],
			},
			{
				namePL: "Przebieg Licznika",
				name: "mileage_1",
				code: "mileage",
				length: 5,
				showToUser: "mileage",
				default: 0,
				select: "value",
			},
			{
				required: true,
				namePL: "Ilość Litrów",
				name: "capacity",
				code: "capacity",
				length: 3,
				showToUser: "liters",
				default: 0,
				select: "value",
			},
		],
	},
	f:
	{
		name: "Tankowanie",
		test: function(package)
		{
			return package.length > 0
		},
		structure:
		[
			{
				namePL: "Miejsce",
				name: "place",
				code: "identifier",
				length: 2,
				showToUser: "placeName",
				default: 0,
				select: "place",
				acceptable: ["refueling"],
			},
			{
				required: true,
				namePL: "Przebieg Licznika",
				name: "mileage_1",
				code: "mileage",
				length: 5,
				showToUser: "mileage",
				default: 0,
				select: "value",
			},
			{
				required: true,
				namePL: "Ilość Litrów",
				name: "capacity",
				code: "capacity",
				length: 3,
				showToUser: "liters",
				default: 0,
				select: "value",
			},
		],
	},
	g:
	{
		name: "AdBlue Częściowe",
		test: function(package)
		{
			return package.length > 0
		},
		structure:
		[
			{
				namePL: "Miejsce",
				name: "place",
				code: "identifier",
				length: 2,
				showToUser: "placeName",
				default: 0,
				select: "place",
				acceptable: ["adblue"],
			},
			{
				namePL: "Przebieg Licznika",
				name: "mileage_1",
				code: "mileage",
				length: 5,
				showToUser: "mileage",
				default: 0,
				select: "value",
			},
			{
				required: true,
				namePL: "Ilość Litrów",
				name: "capacity",
				code: "capacity",
				length: 3,
				showToUser: "liters",
				default: 0,
				select: "value",
			},
		],
	},
	h:
	{
		name: "Pełne AdBlue",
		test: function(package)
		{
			return package.length > 0
		},
		structure:
		[
			{
				namePL: "Miejsce",
				name: "place",
				code: "identifier",
				length: 2,
				showToUser: "placeName",
				default: 0,
				select: "place",
				acceptable: ["adblue"],
			},
			{
				required: true,
				namePL: "Przebieg Licznika",
				name: "mileage_1",
				code: "mileage",
				length: 5,
				showToUser: "mileage",
				default: 0,
				select: "value",
			},
			{
				required: true,
				namePL: "Ilość Litrów",
				name: "capacity",
				code: "capacity",
				length: 3,
				showToUser: "liters",
				default: 0,
				select: "value",
			},
		],
	},
	i:
	{
		name: "Postój Na Sen",
		test: function(package)
		{
			return package.length > 0
		},
		structure:
		[
			{
				namePL: "Miejsce",
				name: "place",
				code: "identifier",
				length: 2,
				showToUser: "placeName",
				default: 0,
				select: "place",
				acceptable: ["sleep"],
			},
			{
				required: true,
				namePL: "Przebieg Licznika",
				name: "mileage_1",
				code: "mileage",
				length: 5,
				showToUser: "mileage",
				default: 0,
				select: "value",
			},
		],
	},
	j:
	{
		name: "Koniec Postoju",
		test: function(package)
		{
			return (package.length > 0 && package[package.length-1].type == "i")
		},
		structure:
		[
		],
	},
	k:
	{
		name: "Zmiana Pojazdu",
		test: function(package)
		{
			return package.length > 0
		},
		structure:
		[
			{
				required: true,
				namePL: "Zmiana Na:",
				name: "car_2",
				code: "identifier",
				length: 2,
				showToUser: "carName",
				default: 0,
			},
			{
				required: true,
				namePL: "Przebieg Poprzedniej",
				name: "mileage_1",
				code: "mileage",
				length: 5,
				showToUser: "mileage",
				default: 0,
				select: "value",
			},
			{
				required: true,
				namePL: "Przebieg następnej",
				name: "mileage_2",
				code: "mileage",
				length: 5,
				showToUser: "mileage",
				default: 0,
				select: "value",
			},
			{
				namePL: "Miejsce",
				name: "place",
				code: "identifier",
				length: 2,
				showToUser: "placeName",
				default: 0,
				select: "place",
				acceptable: ["base","service","refueling","sleep"],
			},
		],
	},
	l:
	{
		name: "Zjazd Do Serwisu",
		test: function(package)
		{
			return package.length > 0
		},
		structure:
		[
			{
				namePL: "Miejsce",
				name: "place",
				code: "identifier",
				length: 2,
				showToUser: "placeName",
				default: 0,
				select: "place",
				acceptable: ["service","base"],
			},
			{
				namePL: "Przebieg Licznika",
				name: "mileage_1",
				code: "mileage",
				length: 5,
				showToUser: "mileage",
				default: 0,
				select: "value",
			},
		],
	},
	m:
	{
		name: "Koniec Serwisu",
		test: function(package)
		{
			return (package.length > 0 && package[package.length-1].type == "l")
		},
		structure:
		[
		],
	},
	n:
	{
		name: "Początek Czekania",
		test: function(package)
		{
			return package.length > 0
		},
		structure:
		[
		],
	},
	o:
	{
		name: "Koniec Czekania",
		test: function(package)
		{
			return (package.length > 0 && package[package.length-1].type == "n")
		},
		structure:
		[
		],
	},
	p:
	{
		name: "Dane Z Tachografu",
		test: function(package)
		{
			return package.length > 0
		},
		structure:
		[
			{
				required: true,
				namePL: "Czas Jazdy",
				name: "ride",
				code: "timeInterval",
				length: 2,
				showToUser: "timeInterval",
				default: [1,0],
			},
			{
				namePL: "Inna praca",
				name: "work",
				code: "timeInterval",
				length: 2,
				showToUser: "timeInterval",
				default: [1,0],
			},
			{
				namePL: "Dyspozycyjność",
				name: "wait",
				code: "timeInterval",
				length: 2,
				showToUser: "timeInterval",
				default: [1,0],
			},
		],
	},
}
let entries = 0
let cars = 0
let places = 0
function load()
{
	setTimeout(()=>{cars = data.read.cars()},1)
	setTimeout(()=>{places = data.read.places()},1)
	setTimeout(()=>{entries = data.read.entries()},1)
	main = document.getElementsByTagName("main")[0]
	defineColors()
	addMenu()
	menuRowOff()
	addCloseFunction()
	document.getElementById("hamburgerButton").onclick = ()=>{HTMLoperations.showWindow("menuWindow")}
	setTimeout(mainFunction||new Function(""),300)
	// -------
	function defineColors()
	{
		for (let i=0 ; i<7 ; i++)
		{
			const color = `hsl(${20+(i*3)},${100-(i*10)}%,${5+(i*9)}%)`
			document.documentElement.style.setProperty(`--color_${i+1}`, color)
		}
	}
	function readTags()
	{
		const hash = window.location.href.match(/#(?<hash>[^#]+)/ig)
		console.log(hash)
		return hash
	}
	function menuRowOff()
	{
		const t = document.getElementsByClassName("menuRow")
		for (let el of t)
		{
			if (el.href == location.href)
			{
				el.style.opacity = 0.4
			}
		}
	}
	function addMenu()
	{
		const menu=
		[
			{
				name:"Statystyki",
				href:"nt-statistics.html",
				symbol:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 120.5"><path fill="var(--color_5)" d="M64.82,68.27l48.4,0.8c0,17.19-8.55,33.26-22.81,42.86L64.82,68.27L64.82,68.27z M59.99,59.92L59.44,3.63 L59.41,0l3.61,0.25h0.01h0.01c4.56,0.32,8.98,1.12,13.21,2.33c4.23,1.21,8.29,2.86,12.13,4.87c19.67,10.34,33.27,30.56,34.34,54.02 l0.16,3.61l-3.61-0.11l-56.02-1.72l-3.23-0.1L59.99,59.92L59.99,59.92z M66.19,7.33l0.48,49.31l49.06,1.5 c-2.1-19.45-13.88-36.02-30.48-44.74c-3.41-1.79-7.04-3.26-10.84-4.35C71.74,8.28,69,7.71,66.19,7.33L66.19,7.33z M55.19,65.31 l27.6,47.8c-8.38,4.84-17.92,7.39-27.6,7.39C24.71,120.5,0,95.78,0,65.31c0-29.57,23.31-53.9,52.86-55.14L55.19,65.31L55.19,65.31z"/></svg>`,
			},
			{
				name:"Przegląd Tras",
				href:"nt-routes.html",
				symbol:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 123.22 123.38"><path fill="var(--color_5)" d="M0.34,123.13L38.94,0.25h7.2L11.69,123.13H0.34L0.34,123.13z M59.95,7.96h3.93l0.54,13.55h-5.29L59.95,7.96 L59.95,7.96z M55.68,94.71h12.53l0.99,21.71l-15.06,0.13L55.68,94.71L55.68,94.71z M56.85,63.86h9.84l1.14,19.21h-11.9L56.85,63.86 L56.85,63.86z M58.64,33.12h6.55l0.86,19.21h-8.33L58.64,33.12L58.64,33.12z M48.34,0.25h26.68l27.17,122.88H21.81L48.34,0.25 L48.34,0.25z M77.2,0.25h7.74l37.94,122.88H112.1L77.2,0.25L77.2,0.25z"/></svg>`,
			},
			{
				name:"Zarządzaj Miejscami",
				href:"nt-places.html",
				symbol:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 112.07"><path fill="var(--color_5)" d="M61.44,0L0,60.18l14.99,7.87L61.04,19.7l46.85,48.36l14.99-7.87L61.44,0L61.44,0z M18.26,69.63L18.26,69.63 L61.5,26.38l43.11,43.25h0v0v42.43H73.12V82.09H49.49v29.97H18.26V69.63L18.26,69.63L18.26,69.63z"/></svg>`,
			},
			{
				name:"Zarządzaj Samochodami",
				href:"nt-cars.html",
				symbol:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 73.14"><path fill="var(--color_5)" d="M41.63,58.19a12.9,12.9,0,1,0,25.64,2,13.7,13.7,0,0,0-.16-2H89.28a14.22,14.22,0,0,0-.12,1.87,13.08,13.08,0,0,0,26.16,0,12.7,12.7,0,0,0-.21-2.33,8,8,0,0,0,7.77-7.93V24.14L106.61,6.64H84.32V45.51h-80A3.27,3.27,0,0,0,1,48.68V55A3.27,3.27,0,0,0,4.31,58.2H7.94a12.48,12.48,0,0,0-.16,2,12.9,12.9,0,1,0,25.79,0,13.7,13.7,0,0,0-.16-2h8.22ZM76.48,0H4.1A4.12,4.12,0,0,0,0,4.1V42.27H80.58V4.1A4.11,4.11,0,0,0,76.48,0ZM15.71,60.26c0,6.53,9.92,6.53,9.92,0,0-7-9.92-6.27-9.92,0Zm81.49-.21c0,6.61,10.06,6.61,10.06,0s-10.06-6.65-10.06,0Zm9.33-45.85L114.74,24v3.56H92.49V14.2ZM49.42,60.26c0,6.53,9.92,6.53,9.92,0s-9.92-6.52-9.92,0Z"/></svg>`,
			},
			{
				name:"Notatnik Odległości",
				href:"nt-distance.html",
				symbol:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 109.69 122.88"><path fill="var(--color_5)" d="M101.41,37.05c-1.95,2.14-4.22,4.05-6.77,5.6c-0.31,0.23-0.74,0.26-1.09,0.03c-3.76-2.39-6.93-5.27-9.41-8.4 c-3.43-4.3-5.59-9.07-6.33-13.66c-0.75-4.66-0.05-9.14,2.27-12.79C81,6.4,82.17,5.08,83.59,3.95c3.27-2.6,7-3.98,10.73-3.95 c3.58,0.03,7.12,1.36,10.18,4.15c1.08,0.98,1.98,2.09,2.72,3.31c2.49,4.11,3.03,9.34,1.93,14.65 C108.07,27.36,105.39,32.69,101.41,37.05L101.41,37.05L101.41,37.05z M9.82,64.7h8.72c1.45,0,2.57,0.36,3.35,1.08 c0.78,0.72,1.17,1.61,1.17,2.67c0,0.89-0.28,1.66-0.83,2.29c-0.37,0.43-0.91,0.76-1.62,1.01c1.08,0.26,1.88,0.7,2.39,1.34 c0.51,0.63,0.76,1.43,0.76,2.39c0,0.78-0.18,1.48-0.54,2.11c-0.36,0.62-0.86,1.12-1.49,1.48c-0.39,0.22-0.98,0.39-1.77,0.49 c-1.05,0.14-1.74,0.21-2.09,0.21H9.82V64.7L9.82,64.7z M14.51,70.62h2.03c0.73,0,1.23-0.13,1.52-0.38 c0.28-0.25,0.43-0.61,0.43-1.09c0-0.44-0.14-0.78-0.43-1.03c-0.28-0.25-0.78-0.37-1.49-0.37h-2.06V70.62L14.51,70.62z M14.51,76.53 h2.37c0.8,0,1.37-0.14,1.7-0.43c0.33-0.28,0.49-0.66,0.49-1.14c0-0.45-0.16-0.8-0.49-1.07c-0.33-0.27-0.9-0.41-1.71-0.41h-2.36 V76.53L14.51,76.53z M96.62,21.82h-5.27l-0.76,2.48h-4.75l5.67-15.07h5.1l5.65,15.07h-4.87L96.62,21.82L96.62,21.82z M95.64,18.56 l-1.64-5.41l-1.65,5.41H95.64L95.64,18.56z M23.88,92.06c-1.95,2.14-4.22,4.05-6.77,5.6c-0.31,0.23-0.74,0.26-1.09,0.03 c-3.76-2.4-6.93-5.27-9.41-8.4C3.19,85,1.03,80.23,0.29,75.63c-0.75-4.66-0.05-9.14,2.27-12.78c0.91-1.44,2.08-2.75,3.51-3.88 c3.27-2.6,7-3.98,10.72-3.95c3.58,0.03,7.12,1.36,10.18,4.15c1.08,0.98,1.98,2.09,2.72,3.31c2.49,4.11,3.03,9.34,1.93,14.65 C30.54,82.37,27.86,87.7,23.88,92.06L23.88,92.06L23.88,92.06z M17.07,103.04c4.51,0,8.32,3.02,9.52,7.14h59.97 c2.96,0,5.66-1.21,7.62-3.17c1.96-1.96,3.17-4.65,3.17-7.62l0,0c0-2.96-1.21-5.66-3.17-7.62c-1.96-1.96-4.65-3.17-7.62-3.17H65.58 v0c-4.71,0-8.99-1.92-12.09-5.02c-3.1-3.1-5.02-7.38-5.02-12.09l0,0c0-4.71,1.92-8.99,5.02-12.09c3.1-3.1,7.38-5.02,12.09-5.02 h18.97c1.3-3.96,5.03-6.82,9.42-6.82c5.48,0,9.92,4.44,9.92,9.92c0,5.48-4.44,9.92-9.92,9.92c-4.35,0-8.04-2.8-9.38-6.69H65.58 c-2.96,0-5.66,1.21-7.62,3.17c-1.96,1.96-3.17,4.65-3.17,7.62l0,0c0,2.96,1.21,5.66,3.17,7.62c1.94,1.94,4.61,3.15,7.55,3.17v0 h21.06c4.71,0,8.99,1.92,12.09,5.02c3.1,3.1,5.02,7.38,5.02,12.09l0,0c0,4.71-1.92,8.99-5.02,12.09c-3.1,3.1-7.38,5.02-12.09,5.02 H26.34c-1.43,3.73-5.04,6.37-9.27,6.37c-5.48,0-9.92-4.44-9.92-9.92C7.15,107.48,11.59,103.04,17.07,103.04L17.07,103.04z"/></svg>`,
			},
		]
		for (let row of menu)
		{
			const menuRow = document.createElement("a")
			menuRow.className = "menuRow"
			menuRow.href = row.href
			//
			const menuText = document.createElement("a")
			menuText.className = "menuText"
			menuText.innerHTML = row.name
			//
			const menuSymbol = document.createElement("a")
			menuSymbol.className = "menuSymbol"
			menuSymbol.innerHTML = row.symbol
			//
			menuRow.appendChild(menuText)
			menuRow.appendChild(menuSymbol)
			menuWindow.appendChild(menuRow)
		}
	}
	function addCloseFunction()
	{
		const closeButtons = document.getElementsByClassName("closeButton")
		for (let closeButton of closeButtons)
		{
			closeButton.onclick = HTMLoperations.closeWindow
		}
	}
}
HTMLoperations=
{
	showWindow: function(id,open,close)
	{
		const w = document.getElementById(id)
		if ((/windowHiden/.test(w.className) || open) && !close)
		{
			w.className = "window"
		}
		else
		{
			w.className = "window windowHiden"
		}
	},
	closeWindow: function(closeButton)
	{
		const w = closeButton.currentTarget.parentNode
		if (!(/windowHiden/.test(w.className)))
		{
			w.className += " windowHiden"
		}
	},
	info: function(text,ansfers)
	{
		document.getElementById("infoWindowAnswers").innerHTML = ""
		if (text && typeof text=="string")
		{
			document.getElementById("infoWindowContent").innerHTML = text
			if (!Array.isArray(ansfers))
			{
				const ansfer = document.createElement("div")
				ansfer.className = "infoAnswers"
				ansfer.innerHTML = "OK"
				ansfer.onclick = ()=>{HTMLoperations.info()}
				document.getElementById("infoWindowAnswers").appendChild(ansfer)
			}
			else
			{
				for (let i=0 ; i<ansfers.length ; i++)
				{
					const ansfer = document.createElement("div")
					ansfer.className = "infoAnswers"
					ansfer.innerHTML = ansfers[i].text
					ansfer.onclick = ()=>{ansfers[i].function();HTMLoperations.info()}
					document.getElementById("infoWindowAnswers").appendChild(ansfer)
				}
			}
			document.getElementById("infoWindow").className = ""
		}
		else
		{
			document.getElementById("infoWindow").className = "windowHiden"
		}
	},
	colorWindowCreate: function()
	{
		const colorWindowDiv = document.getElementById("colorWindow")
		colorWindowDiv.style.overflow = "visible"
		colorWindowDiv.style.paddingTop = "12vh"
		if (!colorWindowDiv) {return}
		for (let h=0 ; h<60 ; h++)
		{
			const colorBox = document.createElement("details")
			colorBox.className = "colorBox"
			const summary = document.createElement("summary")
			const color = document.createElement("div")
			color.className = "color"
			color.style.border = `solid 1vh ${HTMLoperations.htmlColor(h,2)}`
			color.id = `h${h}`
			summary.appendChild(color)
			colorBox.appendChild(summary)
			for (let l=0 ; l<5 ; l++)
			{
				const color = document.createElement("div")
				color.className = "color"
				color.style.border = `solid 1vh ${HTMLoperations.htmlColor(h,l)}`
				color.id = `h${h}l${l}`
				color.style.bottom = `${(l+1)*100}%`
				color.onclick = ()=>{editColorElement(h,l)}
				colorBox.appendChild(color)
			}
			colorWindowDiv.appendChild(colorBox)
		}
	},
	selectColor: function(h,l)
	{
		const colors = document.getElementsByClassName("color")
		for (let color of colors)
		{
			if (color.id == `h${h}l${l}` || color.id == `h${h}`)
			{
				color.style.background = HTMLoperations.htmlColor(h,l)
			}
			else
			{
				color.style.background = "black"
			}
		}
	},
	htmlColor: function(h,l)
	{
		if (Array.isArray(h))
		{
			l = h[1]
			h = h[0]
		}
		if (l>=0)
		{
			return `hsl(${h*6},100%,${40+(l*10)}%)`
		}
		else
		{
			return `hsl(${h*6},100%,50%)`
		}
	}
}
data=
{
	read:
	{
		cars: function()
		{
			let s = localStorage.getItem("cars")
			if (!s || typeof s!="string"){return 0}
			s = s.split("!")
			if (!Array.isArray(s)){return 0}
			const cars = []
			for (let i=0 ; i<s.length ; i++)
			{
				if (s[i].length<4){continue}
				const car = {}
				car.name = s[i].slice(2)
				let t =  parseInt(s[i][0]+s[i][1],36)
				car.active = t%2
				t = Math.floor(t/2)
				car.color = [Math.floor(t/5)%60, t%5]
				cars.push(car)
			}
			if (cars.length < 1){return 0}
			return cars
		},
		places: function()
		{
			let s = localStorage.getItem("places")
			if (!s || typeof s!="string"){return 0}
			s = s.split("!")
			if (!Array.isArray(s)){return 0}
			const places = []
			for (let i=0 ; i<s.length ; i++)
			{
				if (s[i].length<6){continue}
				const place = {}
				place.name = s[i].slice(3)
				let t =  parseInt(s[i][0]+s[i][1]+s[i][2],36)
				place.types = {}
				for (let j=0 ; j<placeTypes.length ; j++)
				{
					place.types[placeTypes[j]] = t%2
					t = Math.floor(t/2)
				}
				place.color = [Math.floor(t/5)%60, t%5]
				places.push(place)
			}
			if (places.length < 1){return 0}
			return places
		},
		time: function(code)
		{
			if (!code || typeof code != "string")
			{
				return 0
			}
			if (code.length != 5)
			{
				return 0
			}
			let t = parseInt(code,36)
			t += 15778019 // czas start rok 2000
			t *= 60000 // dokładność co do minuty
			return new Date(t)
		},
		mileage: function(code)
		{
			if (!code || typeof code != "string")
			{
				return 0
			}
			if (code.length != 5)
			{
				return 0
			}
			let t = parseInt(code,36)
			return t/10
		},
		capacity: function(code)
		{
			if (!code || typeof code != "string")
			{
				return 0
			}
			if (code.length != 3)
			{
				return 0
			}
			let t = parseInt(code,36)
			return t/10
		},
		timeInterval: function(code)
		{
			if (!code || typeof code != "string")
			{
				return 0
			}
			if (code.length != 2)
			{
				return 0
			}
			let t = parseInt(code,36)
			return [Math.floor(t/60),t%60]
		},
		identifier: function(code)
		{
			if (!code || typeof code != "string")
			{
				return 0
			}
			if (code.length != 2)
			{
				return 0
			}
			let t = parseInt(code,36)
			return t
		},
		entries: function()
		{
			let s = localStorage.getItem("entries")
			if (!s || typeof s!="string"){return 0}
			console.log(`odczytywanie wpisów. ostatni zapis: ${data.showToUser.date(data.read.time(s.slice(0,5)))}`)
			const entries = []
			s = s.slice(5)
			s = s.split("?")
			if (!Array.isArray(s)){return 0}
			for (let i=0 ; i<s.length ; i++)
			{
				if (s[i].length < 6)
				{
					s[i] = 0
					continue
				}
				s[i] = s[i].split("!")
			}
			for (let i=0 ; i<s.length ; i++)
			{
				if (!s[i]) {continue}
				const package = []
				for (let j=0 ; j<s[i].length ; j++)
				{
					if (s[i][j].length < 6) {continue}
					const entry = decode(s[i][j])
					package.push(entry)
				}
				entries.push(package)
			}
			return entries
			function decode(s)
			{
				const entry = {}
				entry.type = s[0]
				if (!typesOfEntries[entry.type])
				{
					entry.error = `Błędny typ wpisu (${entry.type})`
				}
				entry.time = data.read.time(s.slice(1,6))
				s = s.slice(6)
				const structure = typesOfEntries[entry.type].structure||[]
				let startIndex = 0
				for (let i=0 ; i<structure.length ; i++)
				{
					if (structure[i].length>0)
					{
						const scrap = s.substring(startIndex,startIndex+structure[i].length)
						entry[structure[i].name || `error_${i}`] = (data.read[structure[i].code]||new Function(""))(scrap)||0
						startIndex += structure[i].length
					}
				}
				return entry
			}
		}
	},
	save:
	{
		cars: function(cars)
		{
			if (!Array.isArray(cars))
			{
				info("Coś poszło nie tak podczas zapisywania listy samochodów.<br>Zgłoś błąd autorowi oprogramowania.")
				return 0
			}
			let s = ""
			for (let car of cars)
			{
				let t = (car.color[0]*5 + car.color[1])*2
				if (car.active)
				{
					t+=1
				}
				s += t.toString(36).padStart(2, "0") + car.name.replaceAll("!","q") + "!"
			}
			localStorage.setItem("cars",s)
		},
		places: function(places)
		{
			if (!Array.isArray(places))
			{
				info("Coś poszło nie tak podczas zapisywania listy samochodów.<br>Zgłoś błąd autorowi oprogramowania.")
				return 0
			}
			let s = ""
			for (let place of places)
			{
				let t = place.color[0]*5 + place.color[1]
				for (let j=placeTypes.length-1 ; j>=0 ; j--)
				{
					t*=2
					if (place.types[placeTypes[j]])
					{
						t+=1
					}
				}
				s += t.toString(36).padStart(3, "0") + place.name.replaceAll("!","q") + "!"
			}
			localStorage.setItem("places",s)
		},
		time: function(time)
		{
			let t = Number(time)
			t = Math.floor(Math.floor(t/60000) - 15778019)
			if (t > 0 && t < 60466170)
			{
				// 60466170 jest maksymalnym możliwym czasem do zapisu
				return t.toString(36).padStart(5, "0")
			}
			return 0
		},
		mileage: function(mileage)
		{
			const t = Math.round(mileage*10)
			if (t > 0 && t < 60466170)
			{
				// 60466170 jest maksymalną wartością możliwą do zapisu
				return t.toString(36).padStart(5, "0")
			}
			return 0
		},
		capacity: function(capacity)
		{
			const t = Math.round(capacity*10)
			if (t > 0 && t < 46650)
			{
				// 46650 jest maksymalną wartością możliwą do zapisu
				return t.toString(36).padStart(3, "0")
			}
			return 0
		},
		timeInterval: function(interval)
		{
			if (!Array.isArray(interval))
			{
				return 0
			}
			if (interval[1]>59)
			{
				return 0
			}
			const t = ((interval[0]||1)*60) + (interval[1]||0)
			if (t > 0 && t < 1290)
			{
				// 1290 jest maksymalną wartością możliwą do zapisu
				return t.toString(36).padStart(2, "0")
			}
			return 0
		},
		identifier: function(interval)
		{
			const t = interval
			if (t > 0 && t < 1290)
			{
				// 1290 jest maksymalną wartością możliwą do zapisu
				return t.toString(36).padStart(2, "0")
			}
			return 0
		},
		entries: function(entries)
		{
			if (!Array.isArray(entries))
			{
				info("Coś poszło nie tak podczas zapisywania wpisów.<br>Zgłoś błąd autorowi oprogramowania.")
				return 0
			}
			let s = data.save.time(new Date())
			for (let i=0 ; i<entries.length ; i++)
			{
				for (let j=0 ; j<(entries[i]||[]).length ; j++)
				{
					if (!entries[i][j] || typeof entries[i][j] != "object") {continue}
					if (!typesOfEntries[entries[i][j].type]) {continue}
					const structure = typesOfEntries[entries[i][j].type].structure||[]
					s += entries[i][j].type
					s += data.save.time(entries[i][j].time || new Data())
					for (let k=0 ; k<structure.length ; k++)
					{
						if (structure[k].length>0)
						{
							if (entries[i][j][structure[k].name])
							{
								if (!data.save[structure[k].code])
								{
									return `Błąd podczas zapisu. Brak odpowiedniej funkcji kodowania (${structure[k].code})`
								}
								const t = data.save[structure[k].code](entries[i][j][structure[k].name])
								if (t)
								{
									s += t
								}
								else
								{
									return "Błąd. Podane dane mogą być niepoprawne.<br>Jeżeli dane są poprawne zgłoś błąd autorowi aplikacji."
								}
							}
							else
							{
								if(structure[k].required)
								{
									return "Odmowa zapisu.<br>Nie podałeś wymaganych danych."
								}
								for (let l=0 ; l<structure[k].length ; l++)
								{
									// nadpisanie zerami dla zachowania spójności
									s+="0"
								}
							}
						}
					}
					s += "!"
				}
				s += "?"
			}
			localStorage.setItem("entries",s)
		}
	},
	showToUser:
	{
		carName: function(data)
		{
			return cars[data].name.toUpperCase()
		},
		placeName: function(data)
		{
			return places[data].name
		},
		productName: function(data)
		{
			return "BRAK FUNKCJI"//product[data].name
		},
		mileage: function(data)
		{
			data = `${data}`
			data = data.split("").reverse().join("")
			let t1 = ""
			let t2 = 1
			let t3 = 0
			if (/[\.,]/.test(data))
			{
				t2 = 0
			}
			for (let i=0 ; i<data.length ; i++)
			{
				if (data[i]=="." || data[i]==",")
				{
					t2 = 1
					t1 += ","
				}
				else if (t2)
				{
					if (t3>2)
					{
						t1 += " "
						t3 = 0
					}
					t1 += data[i]
					t3 ++
				}
				else
				{
					t1 += data[i]
				}
			}
			return `${t1.split("").reverse().join("")} km`
		},
		liters: function(data)
		{
			data = `${data}`
			data = data.split("").reverse().join("")
			let t1 = ""
			let t2 = 1
			let t3 = 0
			if (/[\.,]/.test(data))
			{
				t2 = 0
			}
			for (let i=0 ; i<data.length ; i++)
			{
				if (data[i]=="." || data[i]==",")
				{
					t2 = 1
					t1 += ","
				}
				else if (t2)
				{
					if (t3>2)
					{
						t1 += " "
						t3 = 0
					}
					t1 += data[i]
					t3 ++
				}
				else
				{
					t1 += data[i]
				}
			}
			return `${t1.split("").reverse().join("")} L`
		},
		timeInterval: function(data)
		{
			if (!Array.isArray(data)){return "BŁĄD"}
			return `${data[0]}H ${data[1]}min`
		},
		date: function(date)
		{
			return `${date.getDate()} ${["stycznia","lutego","marca","kwietnia","maja","czerwca","lipca","sierpnia","września","października","listopada","grudnia","błędnia"][date.getMonth()+1]} ${date.getFullYear()}r.`
		},
		time: function(date)
		{
			return `${`${date.getHours()}`.padStart(2,"0")}:${`${date.getMinutes()}`.padStart(2,"0")}`
		}
	},
	test: function()
	{
		if (Number(localStorage.getItem("version")||"0") < 1)
		{
			return location.assign("nt-start.html")
		}
		if (Number(localStorage.getItem("version")||"0") != version)
		{
			return location.reload()
		}
		setTimeout(data.test,2000)
	},
	nextVersion: function()
	{
		if (version>98)
		{
			version=0
		}
		localStorage.setItem("version", version+1)
	}
}