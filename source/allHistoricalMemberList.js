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
                address: eventdata.member.address,
                membershipLevel: eventdata.member.membershipLevel,
                isMember: true
            };
        },
        onMembershipEnded(eventdata) {
            if (!members[eventdata.name]) {
                throw new Error(`onMembershipEnded failed. ${eventdata.name} is not a member.`)
            }
            members[eventdata.name].isMember = false;
        }
    }
}


let modelDefinition = {
	snapshotName: "all-historical-members",
    createLogAggregator: snapshot => new LogAggregator(snapshot),
    createDomainModel: (dispatch, logAggregator) => new DomainModel(dispatch, logAggregator)
};


module.exports = modelDefinition;