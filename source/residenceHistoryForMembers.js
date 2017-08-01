const wrapInReadOnlyProxy = require("@scriptabuild/readonlyproxy")

function DomainModel(dispatch, logAggregator) {

    this.listMembers = function() {
		let members = logAggregator.data;
        return Object.keys(members).map(key => Object.assign({
            name: key
        }, members[key]));
    }
}


function LogAggregator(snapshot = {}) {
    let members = snapshot;
    Object.defineProperty(this, "data", {value: wrapInReadOnlyProxy(members), writable: false});

    this.eventHandlers = {
        onNewMemberRegistered(eventdata) {
            if (members[eventdata.member.name]) {
                throw new Error(`onNewMemberRegistered failed. ${eventdata.member.name} is allready a member.`)
            }
            members[eventdata.member.name] = {
                residences: [eventdata.member.address]
            };
        },
        onMemberHasMoved(eventdata) {
            if (!members[eventdata.name]) {
                throw new Error(`onMemberHasMoved failed. ${eventdata.name} is not a member.`)
            }
            members[eventdata.name].residences = [...members[eventdata.name].residences, eventdata.address];
        },
        onAddressCorrected(eventdata) {
            if (!members[eventdata.name]) {
                throw new Error(`onAddressCorrected failed. ${eventdata.name} is not a member.`)
            }
            let len = members[eventdata.name].residences.length;
            members[eventdata.name].residences = [...members[eventdata.name].residences.slice(0, len - 1), eventdata.address];
        }
    }
}


let modelDefinition = {
    snapshotName: "residence-history",
	createLogAggregator: snapshot => new LogAggregator(snapshot),
	createDomainModel: (dispatch, logAggregator) => new DomainModel(dispatch, logAggregator)
}


module.exports = modelDefinition;